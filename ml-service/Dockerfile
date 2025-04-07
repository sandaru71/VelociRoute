FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install aiohttp first
RUN pip install --no-cache-dir aiohttp==3.9.0

# Copy requirements and install other dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Verify installations
RUN pip list

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["python", "main.py"]
