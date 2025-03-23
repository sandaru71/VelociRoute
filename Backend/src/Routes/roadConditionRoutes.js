const express = require('express');
const router = express.Router();
const { default: axios } = require('axios');
const turf = require('@turf/turf');
const { GOOGLE_MAPS_API_KEY } = require('../config/keys');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://10.235.240.196:8000';

// Debug log the configuration
console.log('Road Condition Service Configuration:');
console.log('ML_SERVICE_URL:', ML_SERVICE_URL);
console.log('GOOGLE_MAPS_API_KEY exists:', !!GOOGLE_MAPS_API_KEY);

// Utility function to generate points along route using Turf.js
const generatePointsAlongRoute = (coordinates, interval = 1000) => {
  try {
    // Convert coordinates to GeoJSON LineString
    const line = turf.lineString(coordinates.map(coord => [coord.longitude, coord.latitude]));
    
    // Calculate total length in kilometers
    const length = turf.length(line, { units: 'kilometers' });
    
    // Generate points every 1km
    const points = [];
    for (let i = 0; i <= length; i++) {
      const point = turf.along(line, i, { units: 'kilometers' });
      points.push({
        latitude: point.geometry.coordinates[1],
        longitude: point.geometry.coordinates[0]
      });
    }
    
    return points;
  } catch (error) {
    console.error('Error generating points:', error);
    return [];
  }
};

// Function to fetch Street View image
const fetchStreetViewImage = async (latitude, longitude) => {
  try {
    // First check if Street View is available at this location
    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    const metadataResponse = await axios.get(metadataUrl);
    
    console.log(`Checking Street View at ${latitude},${longitude}:`, metadataResponse.data.status);

    if (metadataResponse.data.status === 'OK') {
      // Street View is available, construct the image URL
      const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${latitude},${longitude}&heading=0&pitch=0&key=${GOOGLE_MAPS_API_KEY}`;
      
      return {
        url: imageUrl,
        available: true,
        date: metadataResponse.data.date,
        panoId: metadataResponse.data.pano_id
      };
    }
    
    return { 
      available: false,
      reason: metadataResponse.data.status
    };
  } catch (error) {
    console.error('Error fetching Street View image:', error.response?.data || error.message);
    return { 
      available: false,
      reason: 'API_ERROR'
    };
  }
};

// Process route and get road conditions
router.post('/analyze', async (req, res) => {
  try {
    const { route } = req.body;
    
    if (!route || !route.coordinates || !Array.isArray(route.coordinates)) {
      return res.status(400).json({ 
        error: 'Invalid request. Route coordinates are required.' 
      });
    }

    console.log('Generating sampling points for route...');
    const samplingPoints = generatePointsAlongRoute(route.coordinates, 1000);
    console.log(`Generated ${samplingPoints.length} sampling points`);
    
    // Fetch Street View images for each point
    console.log('Fetching Street View images...');
    const pointsWithImages = await Promise.all(
      samplingPoints.map(async (point, index) => {
        const streetView = await fetchStreetViewImage(point.latitude, point.longitude);
        return {
          ...point,
          kilometer: index,
          streetView
        };
      })
    );

    // Filter out points where Street View is not available
    const availablePoints = pointsWithImages.filter(point => point.streetView.available);
    const unavailablePoints = pointsWithImages.filter(point => !point.streetView.available);

    console.log(`Found ${availablePoints.length} points with Street View images`);
    console.log(`${unavailablePoints.length} points without Street View images`);

    // Send available images to ML service for classification
    if (availablePoints.length > 0) {
      try {
        const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/classify-route`, {
          images: availablePoints.map(point => ({
            url: point.streetView.url,
            kilometer: point.kilometer
          }))
        });

        console.log('ML service response:', mlResponse.data);

        // Generate a human-readable summary
        const conditions = mlResponse.data.condition_summary;
        let summary = 'Route Analysis: ';
        for (const [condition, percentage] of Object.entries(conditions)) {
          if (percentage > 0) {
            summary += `${Math.round(percentage)}% ${condition.replace('_', ' ')}, `;
          }
        }
        summary = summary.slice(0, -2); // Remove trailing comma

        return res.json({
          message: 'Route analysis completed',
          summary,
          totalPoints: samplingPoints.length,
          availableImages: availablePoints.length,
          mlAnalysis: mlResponse.data,
          points: availablePoints.map(point => ({
            ...point,
            conditions: mlResponse.data.point_classifications.find(p => p.kilometer === point.kilometer)?.classification
          })),
          unavailablePoints: unavailablePoints.map(p => ({
            kilometer: p.kilometer,
            reason: p.streetView.reason
          }))
        });
      } catch (mlError) {
        console.error('ML Service error:', mlError);
        return res.json({
          message: 'Route analysis completed (ML analysis failed)',
          error: 'ML service unavailable',
          totalPoints: samplingPoints.length,
          availableImages: availablePoints.length,
          points: availablePoints,
          unavailablePoints: unavailablePoints.map(p => ({
            kilometer: p.kilometer,
            reason: p.streetView.reason
          }))
        });
      }
    }

    res.json({
      message: 'Route analysis completed (no images available)',
      totalPoints: samplingPoints.length,
      availableImages: 0,
      points: [],
      unavailablePoints: unavailablePoints.map(p => ({
        kilometer: p.kilometer,
        reason: p.streetView.reason
      }))
    });

  } catch (error) {
    console.error('Error analyzing route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get detailed road conditions for specific coordinates
router.post('/conditions', async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({ 
        error: 'Invalid request. Coordinates array is required.' 
      });
    }

    // Fetch Street View images for analysis
    const pointsWithImages = await Promise.all(
      coordinates.map(async (coord, index) => {
        const streetView = await fetchStreetViewImage(coord.latitude, coord.longitude);
        return {
          point: coord,
          kilometer: index,
          streetView
        };
      })
    );

    // Filter available images
    const availablePoints = pointsWithImages.filter(point => point.streetView.available);

    res.json({
      message: 'Street View images fetched successfully',
      totalPoints: coordinates.length,
      availableImages: availablePoints.length,
      points: availablePoints
    });

  } catch (error) {
    console.error('Error getting road conditions:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;
