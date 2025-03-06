const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getPopularRoutes, createPopularRoute } = require('../Controllers/popularRouteController');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Get popular routes with optional filters
router.get('/', getPopularRoutes);

// Create a new popular route
router.post('/', 
    upload.fields([
        { name: 'mapFile', maxCount: 1 },
        { name: 'images', maxCount: 5 }
    ]),
    createPopularRoute
);

module.exports = router;
