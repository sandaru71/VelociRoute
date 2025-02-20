const { getDB } = require("../infrastructure/db");

// Fetch user profile data by ID
const getUserProfile = async (userId) => {
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({ userId: userId });

    return user; // Returns null if not found
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

module.exports = { getUserProfile };
