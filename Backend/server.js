const express = require("express");
require("dotenv").config();
const morgan = require("morgan");
const cors = require("cors");
const { MongoClient } = require('mongodb');
const postRoutes = require('./routes/postRoutes');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: '*', // Allow all origins (replace with your frontend URL in production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// MongoDB connection
let client = null;
let db = null;

async function connectDB() {
  try {
    if (!client) {
      client = new MongoClient(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      await client.connect();
      console.log('🚀 MongoDB Connected!');
    }
    db = client.db('routes_db'); // Connect to the "routes_db" database
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return false;
  }
}

// Middleware to attach db to request
app.use((req, res, next) => {
  if (!db) {
    return res.status(503).json({ error: 'Database not connected' });
  }
  req.db = db;
  next();
});

// API to Fetch Data from MongoDB
app.get('/api/posts', async (req, res) => {
  try {
    const collection = db.collection("posts"); // Access the "posts" collection in "routes_db"
    const data = await collection.find({}).toArray(); // Fetch all documents
    res.json(data); // Send the data as JSON
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Routes
app.use('/api/posts', postRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: "VelociRoute API is running!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

const port = process.env.APP_PORT || 3000;

// Start server only after connecting to MongoDB
async function startServer() {
  const isConnected = await connectDB();
  if (isConnected) {
    app.listen(port, () => {
      console.log(`🚀 Server started on port ${port}`);
    });
  } else {
    console.error('❌ Failed to connect to MongoDB. Server not started.');
    process.exit(1);
  }
}

startServer();