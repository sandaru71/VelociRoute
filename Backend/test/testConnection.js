require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testConnection() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    console.log('MongoDB URI:', process.env.MONGO_URI);
    await client.connect();
    console.log('Successfully connected to MongoDB');
    const db = client.db(process.env.DB_NAME);
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    await client.close();
  }
}

testConnection();
