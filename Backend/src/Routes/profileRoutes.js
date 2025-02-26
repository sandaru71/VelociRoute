const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { connectDB } = require('../Infrastructure/db');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const db = await connectDB();
    const users = db.collection('users');
    
    const userEmail = req.query.email;
    if (!userEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await users.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.post('/profile', async (req, res) => {
  try {
    const db = await connectDB();
    const users = db.collection('users');
    
    const { email, username, fullName, bio, location, profileImage, interests, fitnessLevel } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const updateData = {
      email,
      username,
      fullName,
      bio,
      location,
      profileImage,
      interests,
      fitnessLevel,
      updatedAt: new Date()
    };

    const result = await users.updateOne(
      { email },
      { $set: updateData },
      { upsert: true }
    );

    res.json({ message: 'Profile updated successfully', data: updateData });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload profile image
router.post('/profile/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Convert buffer to base64
    const fileStr = req.file.buffer.toString('base64');
    const fileType = req.file.mimetype;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(
      `data:${fileType};base64,${fileStr}`,
      {
        folder: 'profile_images',
        transformation: [
          { width: 500, height: 500, crop: 'fill' },
          { quality: 'auto' }
        ]
      }
    );

    res.json({
      message: 'Image uploaded successfully',
      imageUrl: uploadResponse.secure_url
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

module.exports = router;
