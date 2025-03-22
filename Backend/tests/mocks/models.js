const mongoose = require('mongoose');

// Import mock models
const PopularRoute = require('./popularRoute.mock');

// Mock models
jest.mock('../../src/models/Activity', () => {
  const mongoose = require('mongoose');
  const mockSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    activityType: { type: String, enum: ['cycling', 'running'], required: true },
    distance: { type: Number, required: true, min: 0 },
    duration: { type: Number, min: 0 },
    averageSpeed: { type: Number },
    elevationGain: { type: Number },
    startTime: { type: Date },
    endTime: { type: Date }
  });
  return mongoose.models.Activity || mongoose.model('Activity', mockSchema);
});

jest.mock('../../src/models/ActivityPosts', () => {
  const mongoose = require('mongoose');
  const mockSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    activityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    caption: { type: String },
    activityType: { type: String, enum: ['cycling', 'running'], required: true },
    distance: { type: Number },
    duration: { type: Number },
    location: { type: String },
    images: [{ type: String }],
    likes: { type: Number, default: 0 },
    comments: [{
      userId: { type: String, required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }]
  });
  return mongoose.models.ActivityPosts || mongoose.model('ActivityPosts', mockSchema);
});

jest.mock('../../src/models/PopularRoute', () => {
  const mongoose = require('mongoose');
  const mockSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    activityType: { type: String, enum: ['cycling', 'running'], required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    distance: { type: Number, required: true },
    elevation: { type: Number },
    averageTime: { type: Number },
    location: { type: String, required: true },
    coordinates: {
      start: {
        latitude: Number,
        longitude: Number
      },
      end: {
        latitude: Number,
        longitude: Number
      },
      waypoints: [{
        latitude: Number,
        longitude: Number,
        elevation: Number
      }]
    },
    images: [{ type: String }]
  }, {
    timestamps: true
  });
  return mongoose.models.PopularRoute || mongoose.model('PopularRoute', mockSchema);
});

jest.mock('../../src/models/UserProfile', () => {
  const mongoose = require('mongoose');
  const mockSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    bio: { type: String },
    profilePicture: { type: String },
    location: { type: String },
    preferences: {
      activityTypes: [{ type: String, enum: ['cycling', 'running'] }],
      privacySettings: {
        profileVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
        activityVisibility: { type: String, enum: ['public', 'private'], default: 'public' }
      }
    }
  }, {
    timestamps: true
  });
  return mongoose.models.UserProfile || mongoose.model('UserProfile', mockSchema);
});

// Export mock models
module.exports = {
  PopularRoute
};
