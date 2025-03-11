from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
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
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the ResNet50 model
model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
model.eval()

# Define image transformations
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Define road condition classes
ROAD_CONDITIONS = {
    'asphalt': ['road', 'highway', 'freeway', 'path', 'street'],
    'gravel': ['dirt_track', 'gravel', 'unpaved', 'dirt_road'],
    'broken': ['broken', 'construction', 'damaged'],
    'wet': ['wet', 'puddle', 'flooded', 'rain']
}

class ImageURL(BaseModel):
    url: str

class RouteImages(BaseModel):
    images: List[Dict[str, str]]

def preprocess_image(image_data: bytes) -> torch.Tensor:
    """Preprocess image for ResNet model."""
    image = Image.open(io.BytesIO(image_data)).convert('RGB')
    image_tensor = transform(image)
    return image_tensor.unsqueeze(0)

def classify_road_condition(predictions: torch.Tensor) -> Dict:
    """Map ImageNet predictions to road conditions."""
    # Get probabilities
    probabilities = torch.nn.functional.softmax(predictions[0], dim=0)
    
    # Get top 5 predictions
    top_probs, top_indices = torch.topk(probabilities, k=5)
    
    # Load ImageNet class labels
    with open(os.path.join(os.path.dirname(__file__), 'imagenet_classes.txt'), 'r') as f:
        categories = [s.strip() for s in f.readlines()]
    
    # Initialize confidence scores
    conditions = {
        'smooth_asphalt': 0.0,
        'gravel': 0.0,
        'broken': 0.0,
        'wet': 0.0
    }
    
    # Map ImageNet classes to road conditions
    for prob, idx in zip(top_probs, top_indices):
        class_name = categories[idx]
        for condition, related_classes in ROAD_CONDITIONS.items():
            if any(related in class_name.lower() for related in related_classes):
                if condition == 'asphalt':
                    conditions['smooth_asphalt'] += float(prob)
                else:
                    conditions[condition] += float(prob)
    
    # Get the most likely condition
    max_condition = max(conditions.items(), key=lambda x: x[1])
    
    return {
        'condition': max_condition[0],
        'confidence': float(max_condition[1]),
        'all_conditions': conditions
    }

@app.post("/classify-image")
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/classify-route")
async def classify_route(route_data: RouteImages):
    try:
        results = []
        for image_data in route_data.images:
            # Download and classify each image
            response = requests.get(image_data['url'])
            response.raise_for_status()
            
            # Preprocess image
            image_tensor = preprocess_image(response.content)
            
            # Get predictions
            with torch.no_grad():
                predictions = model(image_tensor)
            
            # Classify road condition
            classification = classify_road_condition(predictions)
            
            results.append({
                'kilometer': image_data.get('kilometer', 0),
                'classification': classification
            })
        
        # Analyze overall route conditions
        total_points = len(results)
        condition_summary = {}
        for result in results:
            condition = result['classification']['condition']
            condition_summary[condition] = condition_summary.get(condition, 0) + 1
        
        # Convert to percentages
        condition_percentages = {
            k: (v / total_points) * 100 
            for k, v in condition_summary.items()
        }
        
        return {
            'message': 'Route analysis completed',
            'total_points': total_points,
            'condition_summary': condition_percentages,
            'point_classifications': results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
