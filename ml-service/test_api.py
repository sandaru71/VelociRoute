import requests
import json

def test_single_image():
    print("Testing single image classification...")
    # Using a sample Street View image from our previous test
    url = "https://maps.googleapis.com/maps/api/streetview?size=640x640&location=6.9271,79.8612&heading=0&pitch=0&key=AIzaSyDvP_xQ39yqaHS74Je06nasmvEQ5ctSqK4"
    
    response = requests.post(
        "http://localhost:8000/classify-image",
        json={"url": url}
    )
    
    print("Response:", json.dumps(response.json(), indent=2))

def test_route():
    print("\nTesting route classification...")
    # Test with multiple images from our route
    images = [
        {
            "url": "https://maps.googleapis.com/maps/api/streetview?size=640x640&location=6.9271,79.8612&heading=0&pitch=0&key=AIzaSyDvP_xQ39yqaHS74Je06nasmvEQ5ctSqK4",
            "kilometer": 0
        },
        {
            "url": "https://maps.googleapis.com/maps/api/streetview?size=640x640&location=6.918110213845387,79.86144972485464&heading=0&pitch=0&key=AIzaSyDvP_xQ39yqaHS74Je06nasmvEQ5ctSqK4",
            "kilometer": 1
        }
    ]
    
    response = requests.post(
        "http://localhost:8000/classify-route",
        json={"images": images}
    )
    
    print("Response:", json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    try:
        test_single_image()
        test_route()
    except Exception as e:
        print("Error:", str(e))
