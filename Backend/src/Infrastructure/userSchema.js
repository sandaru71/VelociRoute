const { ObjectId } = require('mongodb');

const userSchema = {
    email: String,
    firstName: String,
    lastName: String,
    sport: String,
    location: String,
    profileImage: String,
    coverImage: String,
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    activities: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
};

module.exports = userSchema;
