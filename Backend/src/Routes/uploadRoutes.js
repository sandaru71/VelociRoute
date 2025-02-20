// const path = require('path');
const express = require("express");
// const {cloudinary} = require(path.join(__dirname, 'src', 'Infrastructure', 'cloudinary'));
const cloudinary = require("../Infrastructure/cloudinary");
const upload = require("../Middleware/multer");

const router = express.Router();

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      { folder: "profile_images" }, 
      (error, uploadResult) => {
        if (error) {
          return res.status(500).json({ error: "Cloudinary upload failed" });
        }
        res.json({ imageUrl: uploadResult.secure_url });
      }
    ).end(req.file.buffer);
    
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
