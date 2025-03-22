const mongoose = require('mongoose');

const PopularRouteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  activityType: { type: String, enum: ['cycling', 'running'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  distance: { type: Number, required: true },
  elevation: { type: Number },
  averageTime: { type: Number },
  location: { type: String, required: true },
  mapUrl: { type: String },
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PopularRoute', PopularRouteSchema);
