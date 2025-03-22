const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  activityName: {
    type: String,
    required: true,
    trim: true
  },
  activityType: {
    type: String,
    required: true,
    enum: ['running', 'cycling', 'hiking', 'walking'],
    lowercase: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard'],
    lowercase: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  stats: {
    distance: {
      type: Number,
      min: 0
    },
    duration: {
      type: Number,
      min: 0
    },
    averageSpeed: {
      type: Number,
      min: 0
    },
    elevationGain: {
      type: Number,
      min: 0
    },
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    }
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Image URL must be a valid HTTP/HTTPS URL'
    }
  }],
  gpxUrl: {
    type: String
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for frequently queried fields
activitySchema.index({ userEmail: 1, activityType: 1 });
activitySchema.index({ createdAt: -1 });

// Add any pre/post hooks or methods here if needed
activitySchema.pre('save', function(next) {
  // Any pre-save logic
  next();
});

module.exports = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
