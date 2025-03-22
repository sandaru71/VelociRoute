const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const SavedRoute = require('./Models/SavedRoute');

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

    // Initialize collections
    console.log("Initializing collections...");
    try {
      await SavedRoute.initialize(nativeDb);
      console.log("✅ Saved routes collection initialized successfully!");
    } catch (error) {
      console.error("Error initializing saved routes collection:", error);
    }

    // Store database instances in app.locals
    global.mongooseDb = mongooseDb;
    global.nativeDb = nativeDb;

    return { mongooseDb, nativeDb };
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function closeConnections() {
  try {
    await mongoose.connection.close();
    await client.close();
    console.log("✅ MongoDB connections closed successfully!");
  } catch (error) {
    console.error("❌ Error closing MongoDB connections:", error);
  }
}

module.exports = { connectDB, closeConnections };
