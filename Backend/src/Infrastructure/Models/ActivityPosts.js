const mongoose = require('mongoose');

const activityPostSchema = new mongoose.Schema({
  
})

const ActivityPost = mongoose.model('ActivityPost', activityPostSchema);

module.exports = ActivityPost;