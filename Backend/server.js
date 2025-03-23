const express = require("express");
require("dotenv/config");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const { connectDB } = require('./src/Infrastructure/db');
const cors = require('cors');
const path = require('path');
const popularRoutes = require('./src/Routes/popularRoutes');
const uploadRoutes = require('./src/Routes/uploadRoutes');
const activityRoutes = require('./src/Routes/activityRoutes');
const Activity = require('./src/Infrastructure/Models/Activity');
const activityPostsRoutes = require('./src/Routes/activityPosts.js');
const userProfileRoutes = require('./src/Routes/userProfileRoutes');
const savedRoutes = require('./src/Routes/savedRoutes');

const app = express();

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Increase payload size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!require('fs').existsSync(uploadsDir)) {
  require('fs').mkdirSync(uploadsDir);
}

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Register routes
app.use('/api/popular-routes', popularRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/activity-posts', activityPostsRoutes);
app.use('/api/user', userProfileRoutes);
app.use('/api/saved-routes', savedRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize database connection
connectDB().then(({ nativeDb }) => {
  console.log('Database connection established');
  
  // Store db instance in app.locals
  app.locals.db = nativeDb;

  // Create indexes after connection
  try {
    Activity.createIndexes(nativeDb);
    console.log("✅ Database indexes created successfully!");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
  }

  // Start the server
  const port = process.env.APP_PORT || 3000;
  const host = '0.0.0.0'; // Listen on all network interfaces

  app.listen(port, host, () => {
    console.log(`\n🚀 Server is running!`);
    console.log(`📱 API Endpoints:`);
    console.log(`   • Local Development: http://localhost:${port}/api`);
    console.log(`   • Android Emulator: http://10.0.2.2:${port}/api`);
    console.log(`   • iOS Simulator: http://localhost:${port}/api`);
    console.log(`   • Local Network: http://10.137.28.196:${port}/api`);
    console.log(`Server started on http://${host}:${port}`);
    console.log('Local: http://localhost:3000');
    console.log('On Your Network: http://10.137.28.196:3000');
    console.log('Upload test form available at: http://localhost:3000/upload-test.html');
  });
}).catch(error => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});