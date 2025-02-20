const express = require("express");
const { getUserProfile } = require("../Controllers/userController");

const router = express.Router();

router.get("/:userId", getUserProfile); // Fetch user profile by ID

module.exports = router;
