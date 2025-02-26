// db.js
import { MongoClient } from 'mongodb';

const url = process.env.MONGODB_URI; // Your MongoDB connection string
let db;

export const connectDB = async () => {
    const client = new MongoClient(url);
    await client.connect();
    db = client.db('yourDatabaseName'); // Replace 'yourDatabaseName' with your actual database name
    console.log('Connected to MongoDB');
    return db; // Return the db instance
};

export const getDB = () => db; // Optional: Export the db instance if needed elsewhere
