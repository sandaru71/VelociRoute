const express = require('express');
const router = express.Router();
const userProfileController = require('../Controllers/userProfileController');
const { authenticateToken } = require('../Middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use((req, res, next) => {
    // For development environments (localhost, emulator IPs)
    const devIPs = ['localhost', '127.0.0.1', '10.0.2.2', '10.137.28.196', '192.168.18.4'];
    const host = req.get('host').split(':')[0];
    
    if (devIPs.includes(host)) {
        // Set test user for development
        req.user = { email: 'test@example.com' };
        next();
    } else {
        // Use real authentication for production
        authenticateToken(req, res, next);
    }
});

// Upload image to Cloudinary
router.post('/upload-image', userProfileController.uploadImage);

// Get user profile
router.get('/profile', userProfileController.getUserProfile);

// Update user profile
router.put('/profile', express.json(), userProfileController.updateUserProfile);

module.exports = router;
