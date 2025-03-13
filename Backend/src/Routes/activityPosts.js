const express = require('express');
const router = express.Router();
const { createActivityPost, getAllActivityPosts, likePost, commentOnPost } = require('../Controllers/activityPostsController');
const upload = require('../Utils/multerConfig');
const auth = require('../Infrastructure/Middleware/auth');

// Create post
router.post('/create', auth, upload.array('images', 10), createActivityPost);

// Get all posts
router.get('/', getAllActivityPosts);

// Like a post
router.put('/like/:postId', auth, likePost);

// Comment on a post
router.post('/comment/:postId', auth, commentOnPost);

module.exports = router;