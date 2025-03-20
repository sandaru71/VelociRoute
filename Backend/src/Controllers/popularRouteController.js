const cloudinary = require('cloudinary').v2;
const path = require('path');
const AdmZip = require('adm-zip');
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to validate file extension
const isValidFileExtension = (filename) => {
    const allowedExtensions = ['.gpx', '.kml', '.kmz'];
    const ext = path.extname(filename).toLowerCase();
    return allowedExtensions.includes(ext);
};

// Helper function to handle KMZ files
const handleKMZFile = async (filePath) => {
    try {
        const zip = new AdmZip(filePath);
        const zipEntries = zip.getEntries();
        const kmlEntry = zipEntries.find(entry => entry.entryName.toLowerCase().endsWith('.kml'));
        
        if (!kmlEntry) {
            throw new Error('No KML file found in KMZ archive');
        }

        const tempKmlPath = path.join(path.dirname(filePath), 'extracted.kml');
        zip.extractEntryTo(kmlEntry, path.dirname(filePath), false, true);
        return tempKmlPath;
    } catch (error) {
        throw new Error('Failed to process KMZ file: ' + error.message);
    }
};

// Helper function to clean up uploaded files
const cleanupFiles = (files) => {
    if (!files) return;
    
    const cleanup = (file) => {
        try {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        } catch (error) {
            console.error('Error cleaning up file:', error);
        }
    };

    if (Array.isArray(files)) {
        files.forEach(cleanup);
    } else {
        cleanup(files);
    }
};

exports.getPopularRoutes = async (req, res) => {
    try {
        const {
            activityType,
            difficulty,
            minDistance,
            maxDistance,
            location
        } = req.query;

        let query = {};

        if (activityType && activityType.toLowerCase() !== 'all') {
            query.activityType = activityType.toLowerCase();
        }
        if (difficulty && difficulty.toLowerCase() !== 'all') {
            query.difficulty = difficulty.toLowerCase();
        }
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }
        if (minDistance || maxDistance) {
            query.distance = {};
            if (minDistance) query.distance.$gte = parseFloat(minDistance);
            if (maxDistance) query.distance.$lte = parseFloat(maxDistance);
        }

        const db = req.app.locals.db;
        const routes = await db.collection('routes').find(query).toArray();
        res.json(routes);
    } catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.createPopularRoute = async (req, res) => {
    let uploadedFiles = [];
    try {
        console.log('Received request body:', req.body);
        console.log('Received files:', req.files);

        if (!req.files || !req.files.mapFile) {
            throw new Error('No map file uploaded');
        }

        const {
            name,
            description,
            activityType,
            difficulty,
            distance,
            elevation,
            averageTime,
            location
        } = req.body;

        // Log received fields
        console.log('Received fields:', {
            name,
            description,
            activityType,
            difficulty,
            distance,
            elevation,
            averageTime,
            location
        });

        // Validate required fields
        const missingFields = [];
        if (!name) missingFields.push('name');
        if (!description) missingFields.push('description');
        if (!activityType) missingFields.push('activityType');
        if (!difficulty) missingFields.push('difficulty');
        if (!distance) missingFields.push('distance');
        if (!elevation) missingFields.push('elevation');
        if (!averageTime) missingFields.push('averageTime');
        if (!location) missingFields.push('location');

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Handle map file upload
        let mapUrl = '';
        const mapFile = req.files.mapFile[0];
        uploadedFiles.push(mapFile);

        console.log('Processing map file:', mapFile.originalname);

        // Validate file extension
        if (!isValidFileExtension(mapFile.originalname)) {
            throw new Error(`Invalid file format for ${mapFile.originalname}. Only GPX, KML, and KMZ files are allowed.`);
        }

        let uploadPath = mapFile.path;
        let fileFormat = path.extname(mapFile.originalname).substring(1);

        // Handle KMZ files
        if (fileFormat === 'kmz') {
            console.log('Processing KMZ file...');
            uploadPath = await handleKMZFile(mapFile.path);
            fileFormat = 'kml';
            // Add extracted file to cleanup list
            uploadedFiles.push({ path: uploadPath });
        }

        console.log('Uploading to Cloudinary...');
        const mapResult = await cloudinary.uploader.upload(uploadPath, {
            resource_type: 'raw',
            format: fileFormat
        });
        mapUrl = mapResult.secure_url;
        console.log('Map file uploaded to:', mapUrl);

        // Handle image uploads
        let imageUrls = [];
        if (req.files.images) {
            console.log('Processing images...');
            uploadedFiles = uploadedFiles.concat(req.files.images);
            for (const image of req.files.images) {
                console.log('Uploading image:', image.originalname);
                const result = await cloudinary.uploader.upload(image.path);
                imageUrls.push(result.secure_url);
            }
        }

        const newRoute = {
            name,
            description,
            activityType: activityType.toLowerCase(),
            difficulty: difficulty.toLowerCase(),
            distance: parseFloat(distance),
            elevation: parseFloat(elevation),
            averageTime: parseInt(averageTime),
            location,
            mapUrl,
            images: imageUrls,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        console.log('Creating new route:', newRoute);

        const db = req.app.locals.db;
        const result = await db.collection('routes').insertOne(newRoute);
        
        if (result.acknowledged) {
            // Clean up uploaded files after successful processing
            cleanupFiles(uploadedFiles);
            res.status(201).json({ ...newRoute, _id: result.insertedId });
        } else {
            throw new Error('Failed to insert route');
        }
    } catch (error) {
        // Clean up uploaded files in case of error
        cleanupFiles(uploadedFiles);
        console.error('Error creating route:', error);
        res.status(400).json({ message: error.message });
    }
};
