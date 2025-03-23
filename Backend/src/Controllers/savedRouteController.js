const SavedRoute = require('../Infrastructure/Models/SavedRoute');
const cloudinary = require('../Infrastructure/cloudinary');
const { Readable } = require('stream');
const axios = require('axios');
const toGeoJSON = require('@tmcw/togeojson');
const { DOMParser } = require('xmldom');

const ensureHttps = (url) => {
    if (!url) return url;
    return url.replace('http://', 'https://');
};

const parseGpxToCoordinates = async (gpxUrl) => {
    try {
        const response = await axios.get(ensureHttps(gpxUrl));
        const parser = new DOMParser();
        const gpxDoc = parser.parseFromString(response.data, 'text/xml');
        const geoJson = toGeoJSON.gpx(gpxDoc);
        
        if (geoJson.features && geoJson.features.length > 0) {
            const track = geoJson.features[0];
            if (track.geometry && track.geometry.coordinates) {
                return track.geometry.coordinates.map(coord => ({
                    latitude: coord[1],
                    longitude: coord[0],
                    elevation: coord[2] || 0
                }));
            }
        }
        return [];
    } catch (error) {
        console.error('Error parsing GPX:', error);
        return [];
    }
};

const saveRoute = async (req, res) => {
    try {
        console.log('Starting route save process in backend...');
        
        const { routeName, distance, duration, avgSpeed, elevationGain } = req.body;
        if (!routeName || !distance || !duration) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const { gpxData, elevationProfileImage } = req.files;
        if (!gpxData || !elevationProfileImage) {
            return res.status(400).json({
                success: false,
                message: 'Missing required files'
            });
        }

        const userEmail = req.user.email;
        if (!userEmail) {
            return res.status(401).json({
                success: false,
                message: 'User email not found'
            });
        }

        console.log('Processing request for user:', userEmail);

        // Upload GPX file to Cloudinary
        const gpxUploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'raw',
                    folder: 'gpx_files',
                    public_id: `${userEmail}_${routeName}_${Date.now()}`,
                    format: 'gpx'
                },
                (error, result) => {
                    if (error) {
                        console.error('Error uploading GPX file:', error);
                        reject(error);
                    } else {
                        console.log('GPX file uploaded successfully:', result.secure_url);
                        resolve(result);
                    }
                }
            );

            const readableStream = new Readable();
            readableStream.push(gpxData[0].buffer);
            readableStream.push(null);
            readableStream.pipe(uploadStream);
        });

        // Upload elevation profile image to Cloudinary
        const elevationProfileUploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'elevation_profiles',
                    public_id: `${userEmail}_${routeName}_elevation_${Date.now()}`,
                    format: 'png',
                    resource_type: 'image',
                    transformation: [
                        { width: 800, height: 400, crop: 'fit', quality: 'auto' },
                        { fetch_format: 'auto', flags: 'progressive' }
                    ]
                },
                (error, result) => {
                    if (error) {
                        console.error('Error uploading elevation profile:', error);
                        reject(error);
                    } else {
                        console.log('Elevation profile uploaded successfully:', result.secure_url);
                        resolve(result);
                    }
                }
            );

            const readableStream = new Readable();
            readableStream.push(elevationProfileImage[0].buffer);
            readableStream.push(null);
            readableStream.pipe(uploadStream);
        });

        const routeData = {
            userEmail,
            routeName,
            distance,
            duration,
            avgSpeed,
            elevationGain,
            gpxFileUrl: gpxUploadResult.secure_url,
            elevationProfileUrl: elevationProfileUploadResult.secure_url
        };

        const savedRoute = await SavedRoute.create(req.app.locals.db, routeData);
        
        res.json({
            success: true,
            message: 'Route saved successfully',
            route: {
                _id: savedRoute.insertedId,
                ...routeData
            }
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

const getUserRoutes = async (req, res) => {
    try {
        console.log('getUserRoutes called');
        const userEmail = req.user.email;
        
        if (!req.app.locals.db) {
            console.error('Database connection not available');
            return res.status(500).json({
                success: false,
                message: 'Database connection not available'
            });
        }

        const routes = await SavedRoute.findByUserEmail(req.app.locals.db, userEmail);
        console.log('Found routes:', routes.map(route => ({
            id: route._id,
            name: route.routeName,
            elevationProfileUrl: route.elevationProfileUrl
        })));

        // Parse GPX files for each route
        const routesWithCoordinates = await Promise.all(routes.map(async route => {
            const coordinates = await parseGpxToCoordinates(route.gpxFileUrl);
            return {
                _id: route._id,
                routeName: route.routeName,
                distance: route.distance,
                duration: route.duration,
                avgSpeed: route.avgSpeed,
                elevationGain: route.elevationGain,
                gpxFileUrl: ensureHttps(route.gpxFileUrl),
                elevationProfileUrl: ensureHttps(route.elevationProfileUrl),
                coordinates: coordinates || []
            };
        }));
        
        res.json({
            success: true,
            routes: routesWithCoordinates
        });
    } catch (error) {
        console.error('Error in getUserRoutes controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching routes',
            error: error.message
        });
    }
};

const deleteRoute = async (req, res) => {
    try {
        const { routeId } = req.params;
        const userEmail = req.user.email;

        if (!req.app.locals.db) {
            return res.status(500).json({
                success: false,
                message: 'Database connection not available'
            });
        }

        const result = await SavedRoute.delete(req.app.locals.db, routeId, userEmail);
        
        if (result.deletedCount === 0) {
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

module.exports = {
    saveRoute,
    deleteRoute,
    getUserRoutes
};
