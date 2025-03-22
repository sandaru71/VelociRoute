const cloudinary = require('cloudinary').v2;
const PopularRoute = require('../models/PopularRoute');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const getRoutes = async (req, res) => {
    try {
        const {
            activityType,
            difficulty,
            minDistance,
            maxDistance,
            location
        } = req.query;

        let query = {};

        if (activityType && activityType.toLowerCase() !== 'all') {
            query.activityType = activityType.toLowerCase();
        }
        if (difficulty && difficulty.toLowerCase() !== 'all') {
            query.difficulty = difficulty.toLowerCase();
        }
        if (minDistance || maxDistance) {
            query.distance = {};
            if (minDistance) query.distance.$gte = parseFloat(minDistance);
            if (maxDistance) query.distance.$lte = parseFloat(maxDistance);
        }
        if (location) {
            query.location = new RegExp(location, 'i');
        }

        const routes = await PopularRoute.find(query)
            .sort({ averageRating: -1, createdAt: -1 })
            .select('-__v');

        res.status(200).json(routes);
    } catch (error) {
        console.error('Error getting routes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const createRoute = async (req, res) => {
    try {
        const {
            name,
            description,
            activityType,
            difficulty,
            distance,
            elevation,
            averageTime,
            location,
            coordinates
        } = req.body;

        // Validate required fields
        if (!name || !activityType || !difficulty || !distance || !location) {
            return res.status(400).json({
                error: 'Missing required fields: name, activityType, difficulty, distance, and location are required'
            });
        }

        // Handle image upload if provided
        let imageUrl;
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path);
                imageUrl = result.secure_url;
            } catch (uploadError) {
                console.error('Error uploading image:', uploadError);
                return res.status(500).json({ error: 'Error uploading image' });
            }
        }

        const route = new PopularRoute({
            name,
            description,
            activityType: activityType.toLowerCase(),
            difficulty: difficulty.toLowerCase(),
            distance: parseFloat(distance),
            elevation: elevation ? parseFloat(elevation) : undefined,
            averageTime: averageTime ? parseInt(averageTime) : undefined,
            location,
            coordinates,
            images: imageUrl ? [imageUrl] : []
        });

        await route.save();
        res.status(201).json(route);
    } catch (error) {
        console.error('Error creating route:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getRoutes,
    createRoute
};
