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

// Connect to MongoDB and store connection in app.locals
connectDB().then(async database => {
  app.locals.db = database;
  console.log("🚀 Database Ready!");
  
  // Create indexes after connection
  try {
    await Activity.createIndexes(database);
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
app.use('/api/upload', uploadRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/activity-posts', activityPostsRoutes);

app.get('/', (req, res) => {
  res.send("MongoDB Node.js Driver is running!");
});

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

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