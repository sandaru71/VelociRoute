const express = require("express");
require("dotenv/config");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const connectDB = require('./src/Infrastructure/db'); // Ensure this is the correct import
const cors = require('cors');
const path = require('path');
const os = require('os');
const popularRoutes = require('./src/Routes/popularRoutes');
const uploadRoutes = require('./src/Routes/uploadRoutes');
const activityRoutes = require('./src/Routes/activityRoutes');
const roadConditionRoutes = require('./src/Routes/roadConditionRoutes');
const Activity = require('./src/Infrastructure/Models/Activity');

const app = express();

// Enable CORS with specific options
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Logging middleware
app.use(morgan("dev"));

// Body parsing middleware
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({
  limit: "5mb",
  extended: true,
}));

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

// Connect to MongoDB and store connection in app.locals
connectDB().then(async (db) => {
  app.locals.db = db;
  console.log("🚀 Database Ready!");

  // Ensure indexes are created
  try {
    await Activity.createIndexes(app.locals.db); 
    console.log("✅ Database indexes created successfully!");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
  }
}).catch(err => {
  console.error("❌ Database connection error:", err);
  process.exit(1);
});

// Register routes
app.use('/api/popular-routes', popularRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/road-conditions', roadConditionRoutes); // Changed to match frontend path

// Add 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.url} not found` });
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const port = process.env.APP_PORT || 3000;
const host = '0.0.0.0'; // Listen on all network interfaces

// Get local network IP address safely
const getNetworkAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost'; // Fallback if no network address is found
};

app.listen(port, host, () => {
  console.log(`\n🚀 Server is running!`);
  console.log(`📱 API Endpoints:`);
  console.log(`   • Local Development: http://localhost:${port}/api`);
  console.log(`   • Network: http://${getNetworkAddress()}:${port}/api`);
});
