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

// Enable CORS
app.use(cors());

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

const port = process.env.APP_PORT || 3000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
  console.log(`Upload test form available at: http://localhost:${port}/upload-test.html`);
});