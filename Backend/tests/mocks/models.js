const mongoose = require('mongoose');

// Import mock models
const PopularRoute = require('./popularRoute.mock');

// Mock models
jest.mock('../../src/Infrastructure/Models/Activity', () => {
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
  return mongoose.model('Activity', mockSchema);
});

jest.mock('../../src/Infrastructure/Models/ActivityPosts', () => {
  const mongoose = require('mongoose');
  const mockSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    activityId: { type: String, required: true },
    caption: { type: String },
    activityType: { type: String, enum: ['cycling', 'running'], required: true },
    distance: { type: Number },
    duration: { type: Number },
    location: { type: String },
    images: [{ type: String }],
    likes: { type: Number, default: 0 },
    comments: [{ type: Object }],
    createdAt: { type: Date, default: Date.now }
  });
  return mongoose.model('ActivityPosts', mockSchema);
});

jest.mock('../../src/Infrastructure/Models/PopularRoute', () => {
  const mongoose = require('mongoose');
  const mockSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    activityType: { type: String, enum: ['cycling', 'running'], required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    distance: { type: Number, required: true, min: 0 },
    elevation: { type: Number },
    averageTime: { type: Number },
    location: { type: String, required: true },
    mapUrl: { type: String },
    images: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  return mongoose.model('PopularRoute', mockSchema);
});

jest.mock('../../src/Infrastructure/Models/UserProfile', () => {
  const mongoose = require('mongoose');
  const mockSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    displayName: { type: String, required: true },
    email: { type: String, required: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    bio: { type: String },
    preferredActivities: [{ type: String, enum: ['cycling', 'running'] }],
    profileImage: { type: String },
    totalDistance: { type: Number, default: 0, min: 0 },
    totalActivities: { type: Number, default: 0, min: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  return mongoose.model('UserProfile', mockSchema);
});
