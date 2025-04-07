# VelociRoute ML Service

This service provides road condition analysis using ResNet50 model for the VelociRoute application.

## Features
- Road condition classification
- Image analysis endpoints
- Health monitoring
- Docker containerization
- Automatic deployment

## Setup
1. Install dependencies: `pip install -r requirements.txt`
2. Configure environment variables
3. Run the service: `python app.py`

## API Endpoints
- `/classify-image`: Analyze single road image
- `/classify-route`: Analyze multiple images along a route
- `/health`: Service health check
