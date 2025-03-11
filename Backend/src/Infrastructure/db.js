const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB successfully!");
    
    // Create a new database for the application
    const db = client.db("routes_db"); // Changed back to routes_db for compatibility
    
    // Initialize collections
    const collections = {
      routes: db.collection('routes'),
      activityPosts: db.collection('activityPosts')
    };
    
    // Verify collections
    const collectionList = await db.listCollections().toArray();
    console.log("📚 Available collections:", collectionList.map(c => c.name));
    
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

module.exports = { connectDB, client };
