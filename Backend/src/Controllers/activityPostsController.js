const ActivityPost = require('../Infrastructure/Models/ActivityPosts');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const admin = require('firebase-admin');

// configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.createActivityPost = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No authorization token provided'
            });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userEmail = decodedToken.email;

        if (!userEmail) {
            return res.status(401).json({
                success: false,
                error: 'User email not found.'
            });
        }

        const {
            activityName,
            description,
            activityType,
            rating,
            difficulty,
            route,
            stats
        } = req.body;

        const files = req.files;
        const imageUrls = [];

        if (files && files.length > 0 ) {
            for (const file of files) {
                try {
                    const result = await cloudinary.uploader.upload(file.path, {
                        folder: 'velociroute_posts'
                    });
                    imageUrls.push(result.secure_url);
                } catch (uploadError) {
                    console.error('Error occurred while uploading to Cloudinary: ', uploadError);
                } finally {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                }
            }
        }
        
        let parsedRoute = route;
        let parsedStats = stats;

        try {
            if (typeof route === 'string') {
                parsedRoute = JSON.parse(route);
            }
            if (typeof stats === 'string') {
                parsedStats = JSON.parse(stats);
            }
        } catch (parseError) {
            console.error('Error occurred when parsing routes or stats: ', parseError);
        }

        const activityPost = new ActivityPost({
            userEmail,
            activityName,
            description,
            activityType,
            rating,
            difficulty,
            images: imageUrls,
            route: parsedRoute,
            stats: parsedStats
        });
    
        const result = await activityPost.save(req.app.locals.db);
    
        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error creating activity post: ', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create activity post'
        });
    }
};