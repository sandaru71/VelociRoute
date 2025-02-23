const express = require("express");
require("dotenv/config");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const connectDB = require('./src/Infrastructure/db');
const cors = require('cors');
const path = require('path');
const popularRoutes = require('./src/Routes/popularRoutes');
const uploadRoutes = require('./src/Routes/uploadRoutes');

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

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB and store connection in app.locals
connectDB().then(database => {
  app.locals.db = database;
  console.log("🚀 Database Ready!");
}).catch(err => {
  console.error("❌ Database connection error:", err);
  process.exit(1);
});

// Register routes
app.use('/api/popular-routes', popularRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => {
  res.send("MongoDB Node.js Driver is running!");
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
  console.log('Upload test form available at: http://localhost:3000/upload-test.html');
});