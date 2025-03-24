import requests
import json
import os

# Update this to match your ML service URL
ML_SERVICE_URL = "http://10.235.240.196:8000"

def test_single_image():
    print("Testing single image classification...")
    # Using a sample Street View image from our previous test
    url = "https://maps.googleapis.com/maps/api/streetview?size=640x640&location=6.9271,79.8612&heading=0&pitch=0&key=AIzaSyDvP_xQ39yqaHS74Je06nasmvEQ5ctSqK4"
    
    try:
        print(f"Sending request to {ML_SERVICE_URL}/api/classify-image")
        print("Request payload:", json.dumps({"url": url}, indent=2))
        
        response = requests.post(
            f"{ML_SERVICE_URL}/api/classify-image",
            json={"url": url},
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            timeout=30  # 30 second timeout
        )
        
        print(f"\nResponse Status: {response.status_code}")
        print("Response Headers:", dict(response.headers))
        
        try:
            print("\nResponse Body:", json.dumps(response.json(), indent=2))
        except:
            print("\nRaw Response:", response.text)
            
        if response.status_code != 200:
            print("\nError Details:", response.text)
            
    except Exception as e:
        print(f"Error: {str(e)}")

def test_classify_route():
    # Test images (use publicly accessible Street View images)
    images = [
        {
            "url": "https://maps.googleapis.com/maps/api/streetview?size=400x400&location=6.9271,79.8612&key=AIzaSyDvP_xQ39yqaHS74Je06nasmvEQ5ctSqK4",
            "kilometer": 0
        },
        {
            "url": "https://maps.googleapis.com/maps/api/streetview?size=400x400&location=6.9275,79.8615&key=AIzaSyDvP_xQ39yqaHS74Je06nasmvEQ5ctSqK4",
            "kilometer": 1
        }
    ]
    
    try:
        print(f"Sending request to {ML_SERVICE_URL}/api/classify-route")
        print("Request payload:", json.dumps({"images": images}, indent=2))
        
        response = requests.post(
            f"{ML_SERVICE_URL}/api/classify-route",
            json={"images": images},
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            timeout=30  # 30 second timeout
        )
        
        print(f"\nResponse Status: {response.status_code}")
        print("Response Headers:", dict(response.headers))
        
        try:
            print("\nResponse Body:", json.dumps(response.json(), indent=2))
        except:
            print("\nRaw Response:", response.text)
            
        if response.status_code != 200:
            print("\nError Details:", response.text)
            
    except Exception as e:
        print(f"Error: {str(e)}")

def test_route():
    print("\nTesting route classification...")
    # Test with multiple images from our route
    images = [
        {
            "url": "https://maps.googleapis.com/maps/api/streetview?size=640x640&location=6.9271,79.8612&heading=0&pitch=0&key=AIzaSyDvP_xQ39yqaHS74Je06nasmvEQ5ctSqK4",
            "kilometer": 0.0
        },
        {
            "url": "https://maps.googleapis.com/maps/api/streetview?size=640x640&location=6.918110213845387,79.86144972485464&heading=0&pitch=0&key=AIzaSyDvP_xQ39yqaHS74Je06nasmvEQ5ctSqK4",
            "kilometer": 1.0
        }
    ]
    
    try:
        print(f"Sending request to {ML_SERVICE_URL}/api/classify-route")
        print("Request payload:", json.dumps({"images": images}, indent=2))
        
        response = requests.post(
            f"{ML_SERVICE_URL}/api/classify-route",
            json={"images": images},
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            timeout=30  # 30 second timeout
        )
        
        print(f"\nResponse Status: {response.status_code}")
        print("Response Headers:", dict(response.headers))
        
        try:
            print("\nResponse Body:", json.dumps(response.json(), indent=2))
        except:
            print("\nRaw Response:", response.text)
            
        if response.status_code != 200:
            print("\nError Details:", response.text)
            
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    print("Testing ML Service connectivity...")
    try:
        # First test if the server is reachable
        health_check = requests.get(f"{ML_SERVICE_URL}/docs", timeout=5)
        print(f"ML Service is reachable (status code: {health_check.status_code})")
        
        test_single_image()
        test_classify_route()
        test_route()
    except Exception as e:
        print("Error:", str(e))