const multer = require("multer");

// Configure multer to store images in memory (for direct upload to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
