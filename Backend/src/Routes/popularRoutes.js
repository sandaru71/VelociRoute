const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getPopularRoutes, createPopularRoute } = require('../Controllers/popularRouteController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'mapFile') {
        // Allow GPX, KML, and KMZ files
        if (file.originalname.match(/\.(gpx|kml|kmz)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Only GPX, KML, and KMZ files are allowed!'), false);
        }
    } else if (file.fieldname === 'images') {
        // Allow images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    } else {
        cb(new Error('Unexpected field'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 6 // 1 map file + 5 images
    }
});

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

// Error handling middleware
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File is too large. Maximum size is 10MB.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: 'Too many files uploaded.' });
        }
        return res.status(400).json({ message: `Upload error: ${error.message}` });
    }
    
    if (error.message.includes('Only')) {
        return res.status(400).json({ message: error.message });
    }
    
    console.error('Route error:', error);
    res.status(500).json({ message: 'Internal server error during file upload.' });
});

module.exports = router;
