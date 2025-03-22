const Activity = require('../models/Activity');
const cloudinary = require('../config/cloudinary');

const uploadImages = async (images) => {
  const uploadPromises = images.map(image => 
    cloudinary.uploader.upload(image, {
      folder: 'velociroute_activities',
      transformation: { quality: 'auto:good' }
    })
  );
  const results = await Promise.all(uploadPromises);
  return results.map(result => result.secure_url);
};

const getActivities = async (req, res) => {
  try {
    const { userEmail, activityType } = req.query;
    const query = { userEmail };
    
    if (activityType) {
      query.activityType = activityType;
    }
    
    const activities = await Activity.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json(activities);
  } catch (error) {
    console.error('Error getting activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const recordActivity = async (req, res) => {
  try {
    const {
      userEmail,
      activityName,
      activityType,
      difficulty,
      description,
      stats,
      images
    } = req.body;

    // Validate required fields
    if (!userEmail || !activityName || !activityType || !difficulty) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Upload images if provided
    let imageUrls = [];
    if (images && images.length > 0) {
      imageUrls = await uploadImages(images);
    }

    const activity = new Activity({
      userEmail,
      activityName,
      activityType,
      difficulty,
      description,
      stats,
      images: imageUrls
    });

    const savedActivity = await activity.save();
    res.status(201).json(savedActivity);
  } catch (error) {
    console.error('Error recording activity:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  recordActivity,
  getActivities
};