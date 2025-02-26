const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_images', // Cloudinary folder to store images
    allowed_formats: ['jpeg', 'png', 'jpg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }], // Resizing
  },
});

const upload = multer({ storage });

module.exports = upload;
