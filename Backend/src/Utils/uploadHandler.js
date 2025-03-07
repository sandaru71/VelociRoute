const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for temporary storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// File filter for images and GPX files
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'images' || file.fieldname === 'image') {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/)) {
            req.fileValidationError = 'Only image files are allowed!';
            return cb(new Error('Only image files are allowed!'), false);
        }
    } else if (file.fieldname === 'gpxFile') {
        // Accept GPX files only
        if (!file.originalname.match(/\.(gpx|GPX)$/)) {
            req.fileValidationError = 'Only GPX files are allowed!';
            return cb(new Error('Only GPX files are allowed!'), false);
        }
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Function to upload file to Cloudinary with transformation options
const uploadToCloudinary = async (file, folder) => {
    try {
        let uploadOptions = {
            resource_type: folder === 'gpx' ? 'raw' : 'image',
            folder: folder,
        };

        // Add specific transformations for profile images
        if (folder === 'profile_images') {
            uploadOptions = {
                ...uploadOptions,
                transformation: [
                    { width: 400, height: 400, crop: 'fill', quality: 'auto' },
                    { fetch_format: 'auto' }
                ],
                eager: [
                    // Thumbnail version
                    { width: 150, height: 150, crop: 'fill', quality: 'auto' },
                    // Cover photo version (if needed)
                    { width: 800, height: 400, crop: 'fill', quality: 'auto' }
                ],
                eager_async: true,
                eager_notification_url: process.env.CLOUDINARY_NOTIFICATION_URL
            };
        }

        const result = await cloudinary.uploader.upload(file.path, uploadOptions);
        
        // Return appropriate URL based on the folder
        if (folder === 'profile_images') {
            return {
                url: result.secure_url,
                thumbnail: result.eager?.[0]?.secure_url || result.secure_url,
                cover: result.eager?.[1]?.secure_url || result.secure_url
            };
        }
        
        return result.secure_url;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
};

module.exports = {
    upload,
    uploadToCloudinary
};
