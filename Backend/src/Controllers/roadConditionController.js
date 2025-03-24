const axios = require('axios');
require('dotenv').config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://10.235.240.196:8000';
const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const STREET_VIEW_API_URL = 'https://maps.googleapis.com/maps/api/streetview';

const getRoadConditions = async (req, res) => {
    try {
        const { route } = req.body;
        if (!route || !route.points) {
            return res.status(400).json({ error: 'Route points are required' });
        }

        // Get Street View images for each point
        const imagePromises = route.points.map(async (point, index) => {
            const { lat, lng } = point;
            const imageUrl = ${STREET_VIEW_API_URL}?size=640x640&location=${lat},${lng}&key=${MAPS_API_KEY};
            
            return {
                url: imageUrl,
                kilometer: index // Assuming points are roughly 1km apart
            };
        });

        const images = await Promise.all(imagePromises);

        // Send images to ML service for classification
        const mlResponse = await axios.post(${ML_SERVICE_URL}/api/classify-route, {
            images
        });

        res.json(mlResponse.data);
    } catch (error) {
        console.error('Road condition assessment error:', error);
        res.status(500).json({ 
            error: 'Failed to assess road conditions',
            details: error.message 
        });
    }
};

module.exports = {
    getRoadConditions
};