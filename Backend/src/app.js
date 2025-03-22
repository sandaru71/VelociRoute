const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const activityRoutes = require('./routes/activityRoutes');
const activityPostsRoutes = require('./routes/activityPostsRoutes');
const popularRoutes = require('./routes/popularRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');

// Register routes
app.use('/api/activities', activityRoutes);
app.use('/api/posts', activityPostsRoutes);
app.use('/api/routes', popularRoutes);
app.use('/api/users', userProfileRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Only connect if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

module.exports = app;
