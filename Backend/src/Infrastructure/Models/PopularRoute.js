const mongoose = require('mongoose');

const popularRouteSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    activityType: {
        type: String,
        required: true,
        enum: ['cycling', 'running', 'hiking', 'walking']
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['easy', 'moderate', 'hard', 'expert']
    },
    distance: {
        type: Number,  // in kilometers
        required: true
    },
    elevation: {
        type: Number,  // in meters
        required: true
    },
    averageTime: {
        type: Number,  // in minutes
        required: true
    },
    location: {
        type: String,
        required: true
    },
    mapUrl: {
        type: String,  // Cloudinary URL for GPX file
        required: true
    },
    images: [{
        type: String,  // Array of Cloudinary URLs
        required: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PopularRoute', popularRouteSchema);
