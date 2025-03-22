const express = require('express');
const router = express.Router();
const { recordActivity, getActivities } = require('../controllers/activityController');
const multer = require('multer');
const auth = require('../middleware/auth');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Record a new activity with optional images
router.post('/', auth, upload.array('images', 10), recordActivity);

// Get activities with optional filters
router.get('/', auth, getActivities);

module.exports = router;