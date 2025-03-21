const { MongoClient } = require('mongodb');
require('dotenv').config();

class SavedRoute {
    static async initialize(db) {
        try {
            console.log('Initializing saved_routes collection...');
            const collection = db.collection('saved_routes');
            
            // Create indexes
            await collection.createIndex({ userEmail: 1 });
            await collection.createIndex({ routeName: 1 });
            
            console.log('✅ Saved routes collection initialized successfully');
            return collection;
        } catch (error) {
            console.error('Error initializing saved_routes collection:', error);
            throw error;
        }
    }

    static async create(db, routeData) {
        try {
            console.log('Creating new saved route...');
            const collection = db.collection('saved_routes');
            const route = {
                userEmail: routeData.userEmail,
                routeName: routeData.routeName,
                distance: routeData.distance,
                duration: routeData.duration,
                avgSpeed: routeData.avgSpeed,
                elevationGain: routeData.elevationGain,
                gpxFileUrl: routeData.gpxFileUrl,
                elevationProfileUrl: routeData.elevationProfileUrl,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await collection.insertOne(route);
            console.log('✅ Route saved successfully:', result.insertedId);
            return result;
        } catch (error) {
            console.error('Error creating saved route:', error);
            throw error;
        }
    }

    static async findByUserEmail(db, userEmail) {
        try {
            const collection = db.collection('saved_routes');
            return await collection.find({ userEmail }).toArray();
        } catch (error) {
            console.error('Error finding routes by email:', error);
            throw error;
        }
    }

    static async findById(db, routeId) {
        try {
            const collection = db.collection('saved_routes');
            return await collection.findOne({ _id: routeId });
        } catch (error) {
            console.error('Error finding route by id:', error);
            throw error;
        }
    }

    static async delete(db, routeId, userEmail) {
        try {
            const collection = db.collection('saved_routes');
            return await collection.deleteOne({ _id: routeId, userEmail });
        } catch (error) {
            console.error('Error deleting route:', error);
            throw error;
        }
    }
}

module.exports = SavedRoute;
