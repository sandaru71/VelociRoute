const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../Middleware/authMiddleware');
const { saveRoute, deleteRoute, getUserRoutes } = require('../Controllers/savedRouteController');

// Configure multer for memory storage
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
}).fields([
    { name: 'gpxData', maxCount: 1 },
    { name: 'elevationProfileImage', maxCount: 1 }
]);

// Routes with error handling
router.post('/save', (req, res, next) => {
    console.log('Received save route request');
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({
                success: false,
                message: 'File upload error',
                error: err.message
            });
        } else if (err) {
            console.error('Unknown error:', err);
            return res.status(500).json({
                success: false,
                message: 'Unknown error occurred',
                error: err.message
            });
        }
        authenticateToken(req, res, () => saveRoute(req, res));
    });
});

router.delete('/:routeId', authenticateToken, deleteRoute);
router.get('/user', authenticateToken, getUserRoutes);

module.exports = router;
