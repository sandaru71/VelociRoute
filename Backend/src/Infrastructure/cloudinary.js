const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true  // Force HTTPS
});

// Configure global upload defaults
cloudinary.config({
    secure: true,
    secure_distribution: null,
    private_cdn: false,
    use_root_path: true
});

module.exports = cloudinary;
