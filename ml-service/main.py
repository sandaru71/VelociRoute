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
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="VelociRoute Road Condition Classifier")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://10.54.219.97:3000", "http://10.54.219.97:8000", "http://localhost:3000", "http://localhost:19006"],
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
        
        return RoadCondition(
            condition=max_condition[0],
            confidence=float(max_condition[1]),
            all_conditions=conditions
        )
    except Exception as e:
        print(f"Classification error: {str(e)}")
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
        
        return result
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch image: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/classify-route", response_model=RouteAnalysis)
async def classify_route(route_data: RouteImages):
    try:
        print(f"Received request to classify route with {len(route_data.images)} images")
        results = []
        
        for i, image in enumerate(route_data.images):
            print(f"Processing image {i+1}/{len(route_data.images)} at {image.kilometer}km")
            try:
                # Download and process the image
                response = requests.get(image.url)
                if response.status_code != 200:
                    print(f"Failed to download image {i+1}: HTTP {response.status_code}")
                    results.append(RoadClassification(
                        kilometer=image.kilometer,
                        error=f"Failed to download image: HTTP {response.status_code}"
                    ))
                    continue

                image_data = response.content
                print(f"Successfully downloaded image {i+1}")

                # Process the image
                processed_image = preprocess_image(image_data)
                with torch.no_grad():
                    predictions = model(processed_image)
                
                classification = classify_road_condition(predictions)
                print(f"Classified image {i+1} as {classification.condition}")
                
                results.append(RoadClassification(
                    kilometer=image.kilometer,
                    classification=classification
                ))
            except Exception as e:
                print(f"Error processing image {i+1}: {str(e)}")
                results.append(RoadClassification(
                    kilometer=image.kilometer,
                    error=str(e)
                ))
        
        # Calculate summary statistics
        total_points = len(results)
        processed_points = sum(1 for r in results if r.classification is not None)
        
        if processed_points == 0:
            raise HTTPException(status_code=500, detail="No images could be processed successfully")
        
        # Calculate condition summary
        condition_counts = {}
        for result in results:
            if result.classification:
                condition = result.classification.condition
                condition_counts[condition] = condition_counts.get(condition, 0) + 1
        
        condition_summary = {
            condition: count/processed_points 
            for condition, count in condition_counts.items()
        }
        
        print(f"Analysis complete: {processed_points}/{total_points} points processed successfully")
        print("Condition summary:", condition_summary)
        
        return RouteAnalysis(
            summary=f"Successfully analyzed {processed_points} out of {total_points} points along the route",
            total_points=total_points,
            processed_points=processed_points,
            condition_summary=condition_summary,
            point_classifications=results
        )
        
    except Exception as e:
        print(f"Error in classify_route: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Change host to '0.0.0.0' to make it accessible on your local network
    # Use the same port as configured in your mobile app's config
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
