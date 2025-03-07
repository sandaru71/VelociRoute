const express = require('express');
const { getUserProfile, updateUserProfile } = require('../Controllers/userController');

const router = express.Router();

module.exports = (db) => {
    router.get('/:email', (req, res) => getUserProfile(req, res, db));
    router.put('/:email', (req, res) => updateUserProfile(req, res, db));
    return router;
};
