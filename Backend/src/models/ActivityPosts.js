const mongoose = require('mongoose');

const activityPostSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  caption: {
    type: String,
    maxLength: 500
  },
  activityType: {
    type: String,
    enum: ['cycling', 'running'],
    required: true
  },
  distance: {
    type: Number,
    min: 0
  },
  duration: {
    type: Number,
    min: 0
  },
  location: {
    type: String
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return v && v.startsWith('https://');
      },
      message: 'Image URL must be a valid HTTPS URL'
    }
  }],
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  comments: [{
    userId: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      maxLength: 300
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
activityPostSchema.index({ userId: 1, createdAt: -1 });
activityPostSchema.index({ activityId: 1 });
activityPostSchema.index({ activityType: 1 });

const ActivityPosts = mongoose.model('ActivityPosts', activityPostSchema);

module.exports = ActivityPosts;
