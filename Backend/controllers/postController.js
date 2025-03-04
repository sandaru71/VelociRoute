const { ObjectId } = require('mongodb');
const { cloudinary } = require('../infrastructure/config/cloudinary');
const postSchema = require('../infrastructure/models/Post');

const postController = {
  // Get all posts
  getAllPosts: async (req, res) => {
    try {
      const posts = await req.db.collection('posts')
        .find()
        .sort({ createdAt: -1 })
        .toArray();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Create a new post
  createPost: async (req, res) => {
    try {
      const { user, avatar, caption, location, distance, time, achievements } = req.body;
      
      // Handle map file and images
      const mapUrl = req.files?.map ? req.files.map[0].path : null;
      const images = req.files?.images ? req.files.images.map(file => file.path) : [];

      const post = {
        ...postSchema,
        user,
        avatar,
        caption,
        location,
        mapUrl,
        images,
        distance,
        time,
        achievements,
        likes: 0,
        comments: [],
        createdAt: new Date()
      };

      const result = await req.db.collection('posts').insertOne(post);
      const savedPost = await req.db.collection('posts').findOne({ _id: result.insertedId });
      res.status(201).json(savedPost);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Like a post
  likePost: async (req, res) => {
    try {
      const postId = new ObjectId(req.params.id);
      
      const result = await req.db.collection('posts').findOneAndUpdate(
        { _id: postId },
        { $inc: { likes: 1 } },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      res.json(result.value);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Add comment to a post
  addComment: async (req, res) => {
    try {
      const { user, text } = req.body;
      const postId = new ObjectId(req.params.id);

      const comment = {
        user,
        text,
        createdAt: new Date()
      };

      const result = await req.db.collection('posts').findOneAndUpdate(
        { _id: postId },
        { $push: { comments: comment } },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({ message: 'Post not found' });
      }

      res.json(result.value);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

module.exports = postController;
