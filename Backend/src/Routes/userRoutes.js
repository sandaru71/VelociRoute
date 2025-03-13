const express = require('express');
const router = express.Router();
const { getDb } = require('../Infrastructure/db');
const { createUserProfile, updateUserProfile, getUserProfile, getUserActivities } = require('../Infrastructure/Models/User');

// Get user profile
router.get('/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await getUserProfile(email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const userData = req.body;
    
    await updateUserProfile(email, userData);
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user activities
router.get('/users/:email/activities', async (req, res) => {
  try {
    const { email } = req.params;
    const activities = await getUserActivities(email);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
