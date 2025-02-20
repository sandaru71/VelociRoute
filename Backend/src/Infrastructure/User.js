const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sport: { type: String, required: true },
  location: { type: String, required: true },
  profileImage: { type: String }, // URL for profile picture
  backgroundImage: { type: String }, // URL for cover image
});

module.exports = mongoose.model("User", UserSchema);
