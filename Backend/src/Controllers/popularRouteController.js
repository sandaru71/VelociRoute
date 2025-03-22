const cloudinary = require('cloudinary').v2;
const PopularRoute = require('../Infrastructure/Models/PopularRoute');

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
        if (minDistance) {
            query.distance = { $gte: parseFloat(minDistance) };
        }
        if (maxDistance) {
            query.distance = { ...query.distance, $lte: parseFloat(maxDistance) };
        }
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        const routes = await PopularRoute.find(query);
        res.status(200).json(routes);
    } catch (error) {
        console.error('Error getting popular routes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const createRoute = async (req, res) => {
    try {
        const routeData = req.body;

        // Handle image uploads if present
        if (req.files && req.files.length > 0) {
            const imageUrls = [];
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'velociroute_routes'
                });
                imageUrls.push(result.secure_url);
                // Clean up local file
                fs.unlinkSync(file.path);
            }
            routeData.images = imageUrls;
        }

        const route = new PopularRoute(routeData);
        await route.save();

        res.status(201).json(route);
    } catch (error) {
        if (error.name === 'ValidationError') {
            res.status(400).json({ error: error.message });
        } else {
            console.error('Error creating route:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = {
    getRoutes,
    createRoute
};
