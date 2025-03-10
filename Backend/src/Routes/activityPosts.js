const express = require('express');
const router = express.Router();
const {createActivityPost} = require('../Controllers/activityPostsController');

router.post('/create', createActivityPost);

module.exports = router;