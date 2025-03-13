const ActivityPost = require('../Infrastructure/Models/ActivityPosts');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const admin = require('firebase-admin');
const { MongoClient, ObjectId } = require('mongodb');

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
            stats: parsedStats,
            likes: [],
            comments: []
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

exports.getAllActivityPosts = async (req, res) => {
    try {
        // Get the MongoDB connection from app.locals
        const db = req.app.locals.db;
        
        // Use the routes_db database and posts collection
        const posts = await db.collection('posts')
            .find()
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            data: posts
        });
    } catch (error) {
        console.error('Error retrieving posts: ', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve posts'
        });
    }
};

exports.likePost = async (req, res) => {
    try {
        const { postId } = req.params;
        
        // Get user email from auth token
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userEmail = decodedToken.email;

        const db = req.app.locals.db;
        const postsCollection = db.collection('posts');

        const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }

        // Initialize likes array if it doesn't exist
        if (!post.likes) {
            post.likes = [];
        }

        // Toggle like
        const userLikeIndex = post.likes.indexOf(userEmail);
        if (userLikeIndex === -1) {
            post.likes.push(userEmail);
        } else {
            post.likes.splice(userLikeIndex, 1);
        }

        // Update the post in the database
        await postsCollection.updateOne(
            { _id: new ObjectId(postId) },
            { $set: { likes: post.likes } }
        );

        res.status(200).json({
            success: true,
            data: post
        });
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to like post'
        });
    }
};

exports.commentOnPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { text } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Comment text is required'
            });
        }

        // Get user email from auth token
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userEmail = decodedToken.email;

        const db = req.app.locals.db;
        const postsCollection = db.collection('posts');

        const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }

        // Initialize comments array if it doesn't exist
        if (!post.comments) {
            post.comments = [];
        }

        // Add new comment
        const newComment = {
            userEmail,
            text,
            createdAt: new Date()
        };

        // Update the post in the database
        await postsCollection.updateOne(
            { _id: new ObjectId(postId) },
            { $push: { comments: newComment } }
        );

        // Get the updated post
        const updatedPost = await postsCollection.findOne({ _id: new ObjectId(postId) });

        res.status(200).json({
            success: true,
            data: updatedPost
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add comment'
        });
    }
};