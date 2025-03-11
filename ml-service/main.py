from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import tensorflow as tf
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

# Load the EfficientNetB0 model
model = tf.keras.applications.EfficientNetB0(
    include_top=True,
    weights='imagenet',
    input_shape=(224, 224, 3)
)

# Define road condition classes
ROAD_CONDITIONS = {
    'asphalt': ['road', 'highway', 'freeway'],
    'gravel': ['dirt_track', 'gravel_road', 'unpaved'],
    'broken': ['broken_road', 'construction_site'],
    'wet': ['wet_road', 'puddle', 'flooded_road']
}

class ImageURL(BaseModel):
    url: str

class RouteImages(BaseModel):
    images: List[Dict[str, str]]

def preprocess_image(image_data: bytes) -> np.ndarray:
    """Preprocess image for EfficientNet model."""
    image = Image.open(io.BytesIO(image_data)).convert('RGB')
    image = image.resize((224, 224))
    image_array = tf.keras.preprocessing.image.img_to_array(image)
    image_array = tf.keras.applications.efficientnet.preprocess_input(image_array)
    return np.expand_dims(image_array, axis=0)

def classify_road_condition(predictions: np.ndarray) -> Dict:
    """Map ImageNet predictions to road conditions."""
    # Get top 5 predictions
    top_predictions = tf.keras.applications.efficientnet.decode_predictions(predictions, top=5)[0]
    
    # Initialize confidence scores
    conditions = {
        'smooth_asphalt': 0.0,
        'gravel': 0.0,
        'broken': 0.0,
        'wet': 0.0
    }
    
    # Map ImageNet classes to road conditions
    for _, class_name, confidence in top_predictions:
        for condition, related_classes in ROAD_CONDITIONS.items():
            if any(related in class_name for related in related_classes):
                if condition == 'asphalt':
                    conditions['smooth_asphalt'] += confidence
                else:
                    conditions[condition] += confidence
    
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
        image_array = preprocess_image(response.content)
        
        # Get predictions
        predictions = model.predict(image_array)
        
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
            image_array = preprocess_image(response.content)
            
            # Get predictions
            predictions = model.predict(image_array)
            
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
