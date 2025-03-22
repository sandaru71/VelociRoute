const mongoose = require('mongoose');

const popularRouteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  activityType: {
    type: String,
    enum: ['cycling', 'running'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  distance: {
    type: Number,
    required: true,
    min: 0
  },
  elevation: {
    type: Number,
    min: 0
  },
  averageTime: {
    type: Number,
    min: 0
  },
  location: {
    type: String,
    required: true
  },
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
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return v && v.startsWith('https://');
      },
      message: 'Image URL must be a valid HTTPS URL'
    }
  }],
  ratings: [{
    userId: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
popularRouteSchema.index({ activityType: 1, difficulty: 1 });
popularRouteSchema.index({ location: 1 });
popularRouteSchema.index({ distance: 1 });
popularRouteSchema.index({ averageRating: -1 });

const PopularRoute = mongoose.model('PopularRoute', popularRouteSchema);

module.exports = PopularRoute;
