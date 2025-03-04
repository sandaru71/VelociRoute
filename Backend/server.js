const express = require("express");
require("dotenv").config();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient } = require('mongodb');
const postRoutes = require('./routes/postRoutes');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "5mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "5mb",
    extended: true,
  })
);

// MongoDB connection
let client = null;
let db = null;

async function connectDB() {
  try {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db('velocirouteDB'); // Using the exact database name from connection string
    console.log('🚀 MongoDB Connected!');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return false;
  }
}

// Middleware to attach db to request
app.use((req, res, next) => {
  req.db = db;
  next();
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
      console.log(`Server started on port ${port}`);
    });
  } else {
    console.error('Failed to connect to MongoDB. Server not started.');
    process.exit(1);
  }
}

startServer();