const postSchema = {
  user: String,
  avatar: String, // URL to user's avatar
  caption: String,
  location: String,
  mapUrl: String, // Cloudinary URL for GPX map
  images: [], // Array of Cloudinary URLs for activity images
  distance: String,
  time: String,
  achievements: String,
  likes: Number,
  comments: [], // Array of {user: String, text: String, createdAt: Date}
  createdAt: Date
};

module.exports = postSchema;
