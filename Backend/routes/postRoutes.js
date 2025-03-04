const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { upload } = require('../infrastructure/config/cloudinary');

// Configure multer for handling multiple file types
const uploadFields = upload.fields([
  { name: 'map', maxCount: 1 },
  { name: 'images', maxCount: 5 }
]);

// Get all posts
router.get('/', postController.getAllPosts);

// Create a new post
router.post('/', uploadFields, postController.createPost);

// Like a post
router.put('/:id/like', postController.likePost);

// Add comment to a post
router.post('/:id/comment', postController.addComment);

module.exports = router;
