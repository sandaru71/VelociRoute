const express = require('express');
const router = express.Router();
const { saveActivity } = require('../Controllers/activityController');
const upload = require('../Utils/multerConfig');
const auth = require('../Infrastructure/Middleware/auth'); // Assuming you have auth middleware

// Route to save activity with multiple images
router.post('/save', auth, upload.array('images', 10), saveActivity);

module.exports = router;
