const cloudinary = require('cloudinary').v2;
const PopularRoute = require('../Infrastructure/Models/PopularRoute');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.getPopularRoutes = async (req, res) => {
    try {
        const {
            activityType,
            difficulty,
            minDistance,
            maxDistance,
            location
        } = req.query;

        // Log the incoming query parameters
        console.log('Received query parameters:', req.query);

        let query = {};

        if (activityType && activityType.toLowerCase() !== 'all') {
            query.activityType = activityType.toLowerCase();
        }
        if (difficulty && difficulty.toLowerCase() !== 'all') {
            query.difficulty = difficulty.toLowerCase();
        }
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }
        if (minDistance || maxDistance) {
            query.distance = {};
            if (minDistance) query.distance.$gte = parseFloat(minDistance);
            if (maxDistance) query.distance.$lte = parseFloat(maxDistance);
        }

        // Log the constructed MongoDB query
        console.log('MongoDB query:', JSON.stringify(query, null, 2));

        // Check both possible collection names
        const db = req.app.locals.db;
        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
        // Try both 'routes' and 'popularroutes' collections
        let routes = [];
        let totalRoutes = 0;
        
        if (collections.some(c => c.name === 'popularroutes')) {
            console.log('Checking popularroutes collection...');
            totalRoutes = await db.collection('popularroutes').countDocuments({});
            console.log('Total routes in popularroutes:', totalRoutes);
            if (totalRoutes > 0) {
                routes = await db.collection('popularroutes').find(query).toArray();
            }
        }
        
        if (routes.length === 0 && collections.some(c => c.name === 'routes')) {
            console.log('Checking routes collection...');
            totalRoutes = await db.collection('routes').countDocuments({});
            console.log('Total routes in routes:', totalRoutes);
            if (totalRoutes > 0) {
                routes = await db.collection('routes').find(query).toArray();
            }
        }

        console.log('Found routes:', routes.length);
        if (routes.length > 0) {
            console.log('Sample route:', JSON.stringify(routes[0], null, 2));
        }

        res.json(routes);
    } catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.createPopularRoute = async (req, res) => {
    try {
        const {
            name,
            description,
            activityType,
            difficulty,
            distance,
            elevation,
            averageTime,
            location
        } = req.body;

        // Handle map file upload
        let mapUrl = '';
        if (req.files && req.files.mapFile) {
            const result = await cloudinary.uploader.upload(req.files.mapFile.path, {
                resource_type: 'raw'
            });
            mapUrl = result.secure_url;
        }

        // Handle image uploads
        let imageUrls = [];
        if (req.files && req.files.images) {
            const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
            for (const image of imageFiles) {
                const result = await cloudinary.uploader.upload(image.path);
                imageUrls.push(result.secure_url);
            }
        }

        const newRoute = {
            name,
            description,
            activityType: activityType.toLowerCase(),
            difficulty: difficulty.toLowerCase(),
            distance: parseFloat(distance),
            elevation: parseFloat(elevation),
            averageTime: parseInt(averageTime),
            location,
            mapUrl,
            images: imageUrls,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const db = req.app.locals.db;
        const result = await db.collection('routes').insertOne(newRoute);
        
        if (result.acknowledged) {
            res.status(201).json({ ...newRoute, _id: result.insertedId });
        } else {
            throw new Error('Failed to insert route');
        }
    } catch (error) {
        console.error('Error creating route:', error);
        res.status(400).json({ message: error.message });
    }
};
