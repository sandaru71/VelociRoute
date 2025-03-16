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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the ResNet50 model
print("Loading ResNet50 model...")
model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
model.eval()
print("Model loaded successfully")

# Define image transformations
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Load ImageNet class labels
with open(os.path.join(os.path.dirname(__file__), 'imagenet_classes.txt'), 'r') as f:
    categories = [s.strip() for s in f.readlines()]

# Define road condition classes
ROAD_CONDITIONS = {
    'smooth_asphalt': ['road', 'highway', 'freeway', 'path', 'street'],
    'gravel': ['dirt_track', 'gravel', 'unpaved', 'dirt_road'],
    'broken': ['broken', 'construction', 'damaged'],
    'wet': ['wet', 'puddle', 'flooded', 'rain']
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

def classify_road_condition(predictions: torch.Tensor) -> Dict:
    """Map ImageNet predictions to road conditions."""
    try:
        # Get probabilities
        probabilities = torch.nn.functional.softmax(predictions[0], dim=0)
        
        # Get top 5 predictions
        top_probs, top_indices = torch.topk(probabilities, k=5)
        
        # Initialize confidence scores
        conditions = {
            'smooth_asphalt': 0.0,
            'gravel': 0.0,
            'broken': 0.0,
            'wet': 0.0
        }
        
        # Map predictions to road conditions
        for prob, idx in zip(top_probs, top_indices):
            prob_value = float(prob)
            class_name = categories[idx]
            
            # Check each road condition category
            for condition, keywords in ROAD_CONDITIONS.items():
                if any(keyword in class_name.lower() for keyword in keywords):
                    conditions[condition] += prob_value
                    break
            else:  # If no specific match, distribute based on index ranges
                if idx < 150:  # Assuming first 150 classes are more related to roads
                    conditions['smooth_asphalt'] += prob_value * 0.4
                elif idx < 300:
                    conditions['gravel'] += prob_value * 0.3
                elif idx < 450:
                    conditions['broken'] += prob_value * 0.2
                else:
                    conditions['wet'] += prob_value * 0.1
        
        # Normalize probabilities
        total = sum(conditions.values())
        if total > 0:
            conditions = {k: v/total for k, v in conditions.items()}
        
        # Get the most likely condition
        max_condition = max(conditions.items(), key=lambda x: x[1])
        
        return {
            'condition': max_condition[0],
            'confidence': float(max_condition[1]),
            'all_conditions': conditions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification error: {str(e)}")

@app.post("/classify-image", response_model=RoadCondition)
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

@app.post("/classify-route", response_model=RouteAnalysis)
async def classify_route(route_data: RouteImages):
    try:
        results = []
        for image_data in route_data.images:
            try:
                # Download and classify each image
                response = requests.get(image_data.url)
                response.raise_for_status()
                
                # Preprocess image
                image_tensor = preprocess_image(response.content)
                
                # Get predictions
                with torch.no_grad():
                    predictions = model(image_tensor)
                
                # Classify road condition
                classification = classify_road_condition(predictions)
                
                results.append(RoadClassification(
                    kilometer=image_data.kilometer,
                    classification=RoadCondition(**classification)
                ))
            except Exception as e:
                print(f"Error processing image at KM {image_data.kilometer}: {str(e)}")
                results.append(RoadClassification(
                    kilometer=image_data.kilometer,
                    error=str(e)
                ))
        
        # Analyze overall route conditions
        valid_results = [r for r in results if r.classification is not None]
        if not valid_results:
            raise HTTPException(status_code=400, detail="No valid images could be processed")
        
        # Calculate condition percentages
        condition_summary = {}
        for result in valid_results:
            conditions = result.classification.all_conditions
            for condition, confidence in conditions.items():
                condition_summary[condition] = condition_summary.get(condition, 0) + confidence
        
        # Average the conditions
        total_valid = len(valid_results)
        condition_summary = {k: (v / total_valid) * 100 for k, v in condition_summary.items()}
        
        # Generate a human-readable summary
        sorted_conditions = sorted(condition_summary.items(), key=lambda x: x[1], reverse=True)
        summary_parts = []
        for condition, percentage in sorted_conditions:
            if percentage >= 5:  # Only include significant conditions (>5%)
                summary_parts.append(f"{int(percentage)}% {condition.replace('_', ' ')}")
        
        summary = "Route Analysis: " + ", ".join(summary_parts)
        
        return RouteAnalysis(
            summary=summary,
            total_points=len(route_data.images),
            processed_points=len(valid_results),
            condition_summary=condition_summary,
            point_classifications=results
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
