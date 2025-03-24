from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import torch
import torchvision.transforms as transforms
import torchvision.models as models
import numpy as np
from PIL import Image
import io
import requests
import asyncio
import aiohttp
from dotenv import load_dotenv
import os
import logging

load_dotenv()

app = FastAPI(title="VelociRoute Road Condition Classifier")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://10.54.219.97:3000",
        "http://10.54.219.97:8000",
        "http://localhost:3000",
        "http://localhost:19006",
        "http://10.235.240.196:3000",
        "http://10.235.240.196:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Create API router
api_router = FastAPI(title="VelociRoute API")
app.mount("/api", api_router)

# Load the ResNet model and weights
print("Loading ResNet model...")
weights = models.ResNet50_Weights.DEFAULT
model = models.resnet50(weights=weights)
model.eval()

# Get class categories from the model weights
categories = weights.meta["categories"]
print(f"Loaded {len(categories)} categories")

# Define image transformations
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Define road condition classes and keywords
ROAD_CONDITIONS = {
    'smooth_asphalt': ['road', 'highway', 'street', 'pavement', 'asphalt', 'roadway', 'freeway', 'path'],
    'gravel': ['gravel', 'dirt', 'unpaved', 'stone', 'rock', 'trail', 'track', 'soil'],
    'broken': ['broken', 'damaged', 'cracked', 'pothole', 'rough', 'construction', 'rubble'],
    'wet': ['wet', 'rain', 'water', 'puddle', 'slippery', 'flood', 'moist']
}

class ImageURL(BaseModel):
    url: str

class RouteImage(BaseModel):
    url: str
    kilometer: float = Field(..., description="Distance in kilometers from start")

class RouteImages(BaseModel):
    images: List[RouteImage]

class RoadCondition(BaseModel):
    condition: str
    confidence: float
    all_conditions: Dict[str, float]

class RoadClassification(BaseModel):
    kilometer: float
    classification: Optional[RoadCondition] = None
    error: Optional[str] = None

class RouteAnalysis(BaseModel):
    summary: str
    total_points: int
    processed_points: int
    condition_summary: Dict[str, float]
    point_classifications: List[RoadClassification]

def preprocess_image(image_data: bytes) -> torch.Tensor:
    """Preprocess image for ResNet model."""
    try:
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        image_tensor = transform(image)
        return image_tensor.unsqueeze(0)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")

def classify_road_condition(predictions: torch.Tensor) -> RoadCondition:
    """Map ImageNet predictions to road conditions."""
    try:
        # Get probabilities
        probabilities = torch.nn.functional.softmax(predictions[0], dim=0)
        
        # Get top 10 predictions
        top_k = 10
        top_probs, top_indices = torch.topk(probabilities, k=top_k)
        
        # Initialize confidence scores
        conditions = {condition: 0.0 for condition in ROAD_CONDITIONS.keys()}
        
        # Map predictions to road conditions
        for prob, idx in zip(top_probs, top_indices):
            prob_value = float(prob)
            class_name = categories[idx].lower()
            
            # Check each road condition category
            matched = False
            for condition, keywords in ROAD_CONDITIONS.items():
                if any(keyword in class_name for keyword in keywords):
                    conditions[condition] += prob_value
                    matched = True
                    break
            
            # If no match, distribute probability based on class name similarity
            if not matched:
                conditions['smooth_asphalt'] += prob_value * 0.4
                conditions['gravel'] += prob_value * 0.3
                conditions['broken'] += prob_value * 0.2
                conditions['wet'] += prob_value * 0.1
        
        # Normalize probabilities
        total = sum(conditions.values())
        if total > 0:
            conditions = {k: v/total for k, v in conditions.items()}
        
        # Get the most likely condition
        max_condition = max(conditions.items(), key=lambda x: x[1])
        
        logging.info(f"Classified image as {max_condition[0]} with confidence {max_condition[1]}")
        
        return RoadCondition(
            condition=max_condition[0],
            confidence=float(max_condition[1]),
            all_conditions=conditions
        )
    except Exception as e:
        logging.error(f"Classification error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Classification error: {str(e)}")

@api_router.post("/classify-image", response_model=RoadCondition)
async def classify_single_image(image_url: ImageURL):
    try:
        # Download image from URL
        response = requests.get(image_url.url)
        response.raise_for_status()
        
        # Preprocess image
        image_tensor = preprocess_image(response.content)
        
        # Get predictions
        with torch.no_grad():
            predictions = model(image_tensor)
        
        # Classify road condition
        result = classify_road_condition(predictions)
        
        logging.info(f"Classified single image as {result.condition} with confidence {result.confidence}")
        
        return result
    except requests.RequestException as e:
        logging.error(f"Failed to fetch image: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to fetch image: {str(e)}")
    except Exception as e:
        logging.error(str(e))
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/classify-route", response_model=RouteAnalysis)
async def classify_route(route_data: RouteImages):
    """Process multiple images along a route."""
    logging.info(f"Starting route classification for {len(route_data.images)} images")
    
    classifications = []
    total_points = len(route_data.images)
    processed = 0
    condition_counts = {condition: 0 for condition in ROAD_CONDITIONS.keys()}
    
    async def process_image(image):
        try:
            logging.info(f"Processing image at kilometer {image.kilometer}")
            # Download and process image
            async with aiohttp.ClientSession() as session:
                async with session.get(image.url) as response:
                    response.raise_for_status()
                    image_data = await response.read()
            
            # Preprocess image
            image_tensor = preprocess_image(image_data)
            
            # Get model predictions
            with torch.no_grad():
                predictions = model(image_tensor)
            
            # Classify road condition
            classification = classify_road_condition(predictions)
            
            # Update condition counts
            condition_counts[classification.condition] += 1
            
            return RoadClassification(
                kilometer=image.kilometer,
                classification=classification
            )
        except Exception as e:
            logging.error(f"Error processing image at kilometer {image.kilometer}: {str(e)}")
            return RoadClassification(
                kilometer=image.kilometer,
                error=str(e)
            )
    
    tasks = [process_image(image) for image in route_data.images]
    results = await asyncio.gather(*tasks)
    
    classifications.extend(results)
    processed = len([result for result in results if result.classification is not None])
    
    # Calculate condition percentages
    total_processed = sum(condition_counts.values())
    condition_summary = {
        condition: (count / total_processed if total_processed > 0 else 0)
        for condition, count in condition_counts.items()
        if count > 0  # Only include conditions that were found
    }
    
    # Generate summary text
    summary = f"Analyzed {processed}/{total_points} points along the route."
    
    logging.info("Route analysis complete")
    logging.info(f"Condition summary: {condition_summary}")
    
    return RouteAnalysis(
        summary=summary,
        total_points=total_points,
        processed_points=processed,
        condition_summary=condition_summary,
        point_classifications=classifications
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)