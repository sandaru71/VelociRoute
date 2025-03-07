const express = require('express');
const router = express.Router();
const { upload, uploadToCloudinary } = require('../Utils/uploadHandler');
const fs = require('fs').promises;

// Configure upload middleware
const uploadFields = upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'gpxFile', maxCount: 1 },
    { name: 'image', maxCount: 1 } // For profile/cover image uploads
]);

// Route to handle file uploads
router.post('/', uploadFields, async (req, res) => {
    try {
        const uploadedFiles = {
            images: [],
            gpxFile: null,
            url: null,
            thumbnail: null,
            cover: null
        };

        // Handle single image upload (profile/cover)
        if (req.files.image) {
            const image = req.files.image[0];
            const result = await uploadToCloudinary(image, 'profile_images');
            // Clean up temporary file
            await fs.unlink(image.path);
            return res.json({
                success: true,
                ...result // This will spread url, thumbnail, and cover URLs
            });
        }

        // Handle multiple image uploads
        if (req.files.images) {
            for (const image of req.files.images) {
                const imageUrl = await uploadToCloudinary(image, 'route_images');
                uploadedFiles.images.push(imageUrl);
                // Clean up temporary file
                await fs.unlink(image.path);
            }
        }

        // Handle GPX file upload
        if (req.files.gpxFile) {
            const gpxFile = req.files.gpxFile[0];
            uploadedFiles.gpxFile = await uploadToCloudinary(gpxFile, 'gpx');
            // Clean up temporary file
            await fs.unlink(gpxFile.path);
        }

        res.json({
            success: true,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
