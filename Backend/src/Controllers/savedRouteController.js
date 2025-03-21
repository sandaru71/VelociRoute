const SavedRoute = require('../Infrastructure/Models/SavedRoute');
const cloudinary = require('../Infrastructure/cloudinary');
const { Readable } = require('stream');

const saveRoute = async (req, res) => {
    try {
        console.log('Starting route save process in backend...');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);

        const { routeName, distance, duration, avgSpeed, elevationGain } = req.body;
        const { gpxData, elevationProfileImage } = req.files;
        const userId = req.user.uid;

        console.log('Extracted data:', {
            routeName,
            distance,
            duration,
            avgSpeed,
            elevationGain,
            userId
        });

        // Upload GPX file to Cloudinary
        console.log('Uploading GPX file to Cloudinary...');
        const gpxUploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'raw',
                    folder: 'gpx_files',
                    public_id: `${userId}_${routeName}_${Date.now()}`,
                    format: 'gpx'
                },
                (error, result) => {
                    if (error) {
                        console.error('GPX upload error:', error);
                        reject(error);
                    } else {
                        console.log('GPX upload success:', result);
                        resolve(result);
                    }
                }
            );

            const stream = Readable.from(gpxData.buffer);
            stream.pipe(uploadStream);
        });

        // Upload elevation profile image to Cloudinary
        console.log('Uploading elevation profile to Cloudinary...');
        const elevationUploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'elevation_profiles',
                    public_id: `${userId}_${routeName}_elevation_${Date.now()}`
                },
                (error, result) => {
                    if (error) {
                        console.error('Elevation profile upload error:', error);
                        reject(error);
                    } else {
                        console.log('Elevation profile upload success:', result);
                        resolve(result);
                    }
                }
            );

            const stream = Readable.from(elevationProfileImage.buffer);
            stream.pipe(uploadStream);
        });

        // Save route data to MongoDB
        console.log('Saving route data to MongoDB...');
        const routeData = {
            userId,
            routeName,
            distance,
            duration,
            avgSpeed,
            elevationGain,
            gpxFileUrl: gpxUploadResult.secure_url,
            elevationProfileUrl: elevationUploadResult.secure_url
        };

        console.log('Route data to save:', routeData);
        const result = await SavedRoute.create(req.app.locals.db, routeData);
        console.log('MongoDB save result:', result);

        res.status(201).json({
            success: true,
            message: 'Route saved successfully',
            routeId: result.insertedId
        });

    } catch (error) {
        console.error('Error in saveRoute controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving route',
            error: error.message
        });
    }
};

const deleteRoute = async (req, res) => {
    try {
        console.log('Starting route delete process...');
        const { routeId } = req.params;
        const userId = req.user.uid;

        console.log('Deleting route:', { routeId, userId });
        const result = await SavedRoute.delete(req.app.locals.db, routeId, userId);
        console.log('Delete result:', result);

        if (result.deletedCount === 0) {
            console.log('Route not found or unauthorized');
            return res.status(404).json({
                success: false,
                message: 'Route not found or unauthorized'
            });
        }

        res.json({
            success: true,
            message: 'Route deleted successfully'
        });

    } catch (error) {
        console.error('Error in deleteRoute controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting route',
            error: error.message
        });
    }
};

const getUserRoutes = async (req, res) => {
    try {
        console.log('Fetching user routes...');
        const userId = req.user.uid;
        console.log('User ID:', userId);

        const routes = await SavedRoute.findByUserId(req.app.locals.db, userId);
        console.log('Found routes:', routes);

        res.json({
            success: true,
            routes
        });

    } catch (error) {
        console.error('Error in getUserRoutes controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user routes',
            error: error.message
        });
    }
};

module.exports = {
    saveRoute,
    deleteRoute,
    getUserRoutes
};
