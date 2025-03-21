const { MongoClient } = require('mongodb');
require('dotenv').config();

class SavedRoute {
    static async initialize(db) {
        const collection = db.collection('saved_routes');
        
        // Create indexes
        await collection.createIndex({ userId: 1 });
        await collection.createIndex({ routeName: 1 });
        
        return collection;
    }

    static async create(db, routeData) {
        const collection = db.collection('saved_routes');
        const route = {
            userId: routeData.userId,
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
        return result;
    }

    static async findByUserId(db, userId) {
        const collection = db.collection('saved_routes');
        return await collection.find({ userId }).toArray();
    }

    static async findById(db, routeId) {
        const collection = db.collection('saved_routes');
        return await collection.findOne({ _id: routeId });
    }

    static async delete(db, routeId, userId) {
        const collection = db.collection('saved_routes');
        return await collection.deleteOne({ _id: routeId, userId });
    }
}

module.exports = SavedRoute;
