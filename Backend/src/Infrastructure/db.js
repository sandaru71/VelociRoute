const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI;

async function connectDB() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB successfully!");
    
    // Get the database instance
    const db = mongoose.connection.db;
    
    // Initialize collections
    const collections = {
      routes: db.collection('routes'),
      activityPosts: db.collection('activityPosts'),
      userProfiles: db.collection('userProfiles')
    };
    
    // Create indexes for userProfiles collection
    await collections.userProfiles.createIndex({ email: 1 }, { unique: true });
    
    // Verify collections
    const collectionList = await db.listCollections().toArray();
    console.log("📚 Available collections:", collectionList.map(c => c.name));
    
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

module.exports = { connectDB };
