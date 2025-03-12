const express = require('express');
const router = express.Router();
const { createActivityPost } = require('../Controllers/activityPostsController');
const upload = require('../Utils/multerConfig');
const auth = require('../Infrastructure/Middleware/auth');

router.post('/create', auth, upload.array('images', 10), createActivityPost);

// router.post('/upload', async (req, res) => {
//     console.log("Recieved data: ", req.body);

//     try{
//         const newActivityPost = new ActivityPost(req.body);
//         await newActivityPost.save();
//         res.status(200).json({ message: 'Post uploaded successfully' });
//     } catch (error) {
//         console.error('Error uploading post:', error);
//         res.status(500).json({ error: 'Failed to upload post' });
//     }
// })

module.exports = router;