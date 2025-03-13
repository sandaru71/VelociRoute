const express = require("express");
require("dotenv/config");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const connectDB = require('./src/Infrastructure/db');
const cors = require('cors');
const path = require('path');
const popularRoutes = require('./src/Routes/popularRoutes');
const uploadRoutes = require('./src/Routes/uploadRoutes');
const activityRoutes = require('./src/Routes/activityRoutes');
const userRoutes = require('./src/Routes/userRoutes');

const app = express();

// Enable CORS with specific options
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "5mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "5mb",
    extended: true,
  })
);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!require('fs').existsSync(uploadsDir)) {
  require('fs').mkdirSync(uploadsDir);
}

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB
connectDB().then(database => {
  app.locals.db = database;
  console.log("🚀 Database Ready!");
  
  // Create indexes after connection
  const activityCollection = database.collection('activities');
  activityCollection.createIndex({ userEmail: 1, createdAt: -1 })
    .then(() => console.log("✅ Activity indexes created successfully!"))
    .catch(error => console.error("❌ Error creating activity indexes:", error));

}).catch(err => {
  console.error("❌ Database connection error:", err);
  process.exit(1);
});

// Register routes
app.use('/api/popular-routes', popularRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api', userRoutes);

app.get('/', (req, res) => {
  res.send("VelociRoute API is running!");
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const port = process.env.APP_PORT || 3000;
const host = '0.0.0.0'; // Listen on all network interfaces

app.listen(port, host, () => {
  console.log(`Server started on http://${host}:${port}`);
  console.log('Local: http://localhost:3000');
  console.log('On Your Network: http://192.168.8.112:3000');
});