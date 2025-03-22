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

const saveGpxFile = async (gpxData, filename) => {
  const filePath = `./uploads/${filename}`;
  
  // Ensure uploads directory exists
  if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads', { recursive: true });
  }

  // Save GPX data to a temporary file
  fs.writeFileSync(filePath, gpxData);

  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'velociroute_gpx',
      resource_type: 'raw',
      public_id: filename.replace('.gpx', '')
    });

    // Delete temporary file
    fs.unlinkSync(filePath);

    return result.secure_url;
  } catch (error) {
    // Clean up temporary file in case of error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

const getActivities = async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { userId } : {};
    
    const activities = await Activity.find(query)
      .sort({ startTime: -1 });

    res.status(200).json(activities);
  } catch (error) {
    console.error('Error getting activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const recordActivity = async (req, res) => {
  try {
    const activityData = req.body;

    // Handle GPX file if present
    if (req.body.gpxData) {
      const gpxUrl = await saveGpxFile(req.body.gpxData, `activity_${Date.now()}.gpx`);
      activityData.gpxUrl = gpxUrl;
    }

    const activity = new Activity(activityData);
    await activity.save();

    res.status(201).json(activity);
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Error recording activity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = {
  recordActivity,
  getActivities
};