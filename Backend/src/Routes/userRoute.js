const express = require('express');
const router = express.Router(); // Initialize the router

// Your existing PUT route for updating the profile
router.put("/profile/:email", async (req, res) => {
  const email = req.params.email;
  const { username, profileImage } = req.body;

  try {
    // Your logic to update the user profile in the database
    // Example:
    const result = await db.collection('users').updateOne(
      { email: email },
      { $set: { username: username, profileImage: profileImage } }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: "Profile updated successfully" });
    } else {
      res.status(400).json({ message: "Profile update failed" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error });
  }
});

module.exports = router; // Export the router
