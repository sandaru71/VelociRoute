const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;

// MongoDB native client for routes and posts
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectDB() {
  try {
    // Connect using Mongoose for user profiles
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB (Mongoose) successfully!");

    // Connect using native client for routes and posts
    await client.connect();
    console.log("✅ Connected to MongoDB (Native) successfully!");
    
    // Get both database instances
    const mongooseDb = mongoose.connection.db;
    const nativeDb = client.db("routes_db");
    
    // Initialize collections using the appropriate connection
    const collections = {
      // Use native client for routes and posts
      routes: nativeDb.collection('routes'),
      activityPosts: nativeDb.collection('activityPosts'),
      // Use mongoose for user profiles
      userProfiles: mongooseDb.collection('userProfiles')
    };
    
    // Create indexes for userProfiles collection
    await collections.userProfiles.createIndex({ email: 1 }, { unique: true });
    
    // Verify collections in both databases
    const mongooseCollections = await mongooseDb.listCollections().toArray();
    const nativeCollections = await nativeDb.listCollections().toArray();
    
    console.log("📚 Mongoose collections:", mongooseCollections.map(c => c.name));
    console.log("📚 Native collections:", nativeCollections.map(c => c.name));
    
    // Return the native db for routes and posts
    return nativeDb;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

// Cleanup function to close both connections
async function closeConnections() {
  try {
    await mongoose.connection.close();
    await client.close();
    console.log("✅ All MongoDB connections closed successfully!");
  } catch (error) {
    console.error("❌ Error closing MongoDB connections:", error);
    throw error;
  }
}

module.exports = { connectDB, closeConnections };
