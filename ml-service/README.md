# VelociRoute Road Condition Classifier

This service uses a pre-trained EfficientNetB0 model to classify road conditions from Street View images.

## Setup

1. Create a Python virtual environment:
bash
python -m venv venv


2. Activate the virtual environment:
- Windows:
bash
.\venv\Scripts\activate


3. Install dependencies:
bash
pip install -r requirements.txt


## Running the Service

Start the FastAPI server:
bash
uvicorn main:app --reload


The service will be available at http://localhost:8000

## API Endpoints

### 1. Classify Single Image
- *Endpoint*: /classify-image
- *Method*: POST
- *Input*: JSON with image URL
json
{
    "url": "https://example.com/image.jpg"
}


### 2. Classify Route
- *Endpoint*: /classify-route
- *Method*: POST
- *Input*: JSON with array of image URLs and their positions
json
{
    "images": [
        {
            "url": "https://example.com/image1.jpg",
            "kilometer": 0
        },
        {
            "url": "https://example.com/image2.jpg",
            "kilometer": 1
        }
    ]
}


## Testing

Run the test script to verify the API:
bash
python test_api.py
