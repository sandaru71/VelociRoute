const Activity = require('../Infrastructure/Models/Activity');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const admin = require('firebase-admin');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.saveActivity = async (req, res) => {
  try {
    // Get Firebase token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify Firebase token and get user email
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userEmail = decodedToken.email;

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        error: 'User email not found'
      });
    }

    const {
      activityName,
      description,
      activityType,
      rating,
      difficulty,
      route,
      stats
    } = req.body;

    const files = req.files;
    let imageUrls = [];

    // Upload images to Cloudinary in parallel
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'velociroute_activities'
          });
          imageUrls.push(result.secure_url);
        } catch (uploadError) {
          console.error('Error uploading to Cloudinary:', uploadError);
        } finally {
          // Clean up local file
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
    }

    // Parse route and stats if they are strings
    let parsedRoute = route;
    let parsedStats = stats;
    try {
      if (typeof route === 'string') {
        parsedRoute = JSON.parse(route);
      }
      if (typeof stats === 'string') {
        parsedStats = JSON.parse(stats);
      }
    } catch (parseError) {
      console.error('Error parsing route or stats:', parseError);
    }

    // Create new activity document
    const activity = new Activity({
      userEmail,
      activityName,
      description,
      activityType,
      rating,
      difficulty,
      images: imageUrls,
      route: parsedRoute,
      stats: parsedStats
    });

    // Save to database
    const result = await activity.save(req.app.locals.db);

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error saving activity:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error saving activity'
    });
  }
};
