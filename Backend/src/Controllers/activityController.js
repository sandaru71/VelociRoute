const Activity = require('../Infrastructure/Models/Activity');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const admin = require('firebase-admin');
const axios = require('axios');
const xml2js = require('xml2js');

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

    // Clean up temporary file
    fs.unlinkSync(filePath);

    return result.secure_url;
  } catch (error) {
    // Clean up temporary file in case of error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error('Error uploading GPX to Cloudinary:', error);
    throw error;
  }
};

const parseGpxToJson = async (gpxContent) => {
  try {
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(gpxContent);
    
    const trk = result?.gpx?.trk?.[0];
    const trkseg = trk?.trkseg?.[0];
    const trkpts = trkseg?.trkpt;

    if (!trkpts || !Array.isArray(trkpts)) {
      return [];
    }

    return trkpts.map(pt => ({
      latitude: parseFloat(pt.$.lat),
      longitude: parseFloat(pt.$.lon)
    }));
  } catch (error) {
    console.error('Error parsing GPX:', error);
    return [];
  }
};

const getAllActivities = async (req, res) => {
  try{
    // Decode firebase token to get user email.
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = req.headers.authorization?.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userEmail = decodedToken.email;

    if(!userEmail) {
      return res.status(401).json({error: 'User email not found'});
    }

    const collection = Activity.getCollection(req.app.locals.db);
    const activities = await collection.find({ userEmail }).toArray();
    
    // Parse GPX data for each activity
    const activitiesWithRoutes = await Promise.all(
      activities.map(async (activity) => {
        const activityObj = {...activity};
        if (activityObj.gpxUrl) {
          try {
            const gpxResponse = await axios.get(activityObj.gpxUrl);
            const coordinates = await parseGpxToJson(gpxResponse.data);
            activityObj.routeCoordinates = coordinates;
          } catch (error) {
            console.error(`Error processing GPX for activity ${activity._id}:`, error);
            activityObj.routeCoordinates = [];
          }
        }
        return activityObj;
      })
    );

    res.status(200).json(activitiesWithRoutes);
  } catch (err) {
    console.error('Error fetching activities: ', err);
    res.status(500).json({error: err.message})
  }
};

const saveActivity = async (req, res) => {
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
      routeFilename,
      stats
    } = req.body;

    const files = req.files;
    let imageUrls = [];
    let gpxUrl = null;

    // Upload images to Cloudinary
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

    // Handle GPX data if present
    if (route && routeFilename) {
      try {
        gpxUrl = await saveGpxFile(route, routeFilename);
      } catch (error) {
        console.error('Error saving GPX file:', error);
      }
    }

    // Parse stats if it's a string
    let parsedStats = stats;
    try {
      if (typeof stats === 'string') {
        parsedStats = JSON.parse(stats);
      }
    } catch (parseError) {
      console.error('Error parsing stats:', parseError);
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
      gpxUrl: gpxUrl,
      stats: parsedStats
    });

    // Save to database
    await activity.save(req.app.locals.db);

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

module.exports = {
  saveActivity,
  getAllActivities
}