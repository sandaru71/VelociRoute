const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    preferredActivity: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    profilePhoto: {
        type: String,
        default: null
    },
    coverPhoto: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = UserProfile;
