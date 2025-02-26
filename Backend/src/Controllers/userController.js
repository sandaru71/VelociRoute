const userService = require("../Services/userService");

// Fetch user profile by ID
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Temporary: Return dummy data for testing
    const dummyUser = {
      id: userId,
      name: "Test User",
      sport: "Running & Cycling",
      location: "New York",
      profileImage: null,
      backgroundImage: null,
      stats: {
        activities: 0,
        distance: "0 km",
        elevation: "0 m"
      }
    };

    res.status(200).json(dummyUser);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getUserProfile };
