const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
    maxLength: 50
  },
  bio: {
    type: String,
    maxLength: 500
  },
  profilePicture: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || v.startsWith('https://');
      },
      message: 'Profile picture URL must be a valid HTTPS URL'
    }
  },
  location: {
    type: String,
    trim: true
  },
  preferences: {
    activityTypes: [{
      type: String,
      enum: ['cycling', 'running']
    }],
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
      },
      activityVisibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
      }
    }
  },
  stats: {
    totalDistance: {
      type: Number,
      default: 0,
      min: 0
    },
    totalActivities: {
      type: Number,
      default: 0,
      min: 0
    },
    achievements: [{
      type: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      description: String,
      dateEarned: {
        type: Date,
        default: Date.now
      }
    }]
  },
  following: [{
    type: String, // userId of followed user
    ref: 'UserProfile'
  }],
  followers: [{
    type: String, // userId of follower
    ref: 'UserProfile'
  }]
}, {
  timestamps: true
});

// Indexes for efficient querying
userProfileSchema.index({ 'preferences.activityTypes': 1 });
userProfileSchema.index({ location: 1 });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = UserProfile;
