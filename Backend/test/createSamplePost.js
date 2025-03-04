require('dotenv').config();
const { MongoClient } = require('mongodb');
const { cloudinary } = require('../infrastructure/config/cloudinary');

const samplePost = {
  user: "John Doe",
  avatar: "https://res.cloudinary.com/dq1hjlghb/image/upload/v1/velociroute/default_avatar.png", // Default avatar in Cloudinary
  caption: "Amazing morning ride through the hills! ",
  location: "Mountain Trail, City",
  distance: "15.5 km",
  time: "1h 25m",
  achievements: "Personal best on hill climb!",
  likes: 0,
  comments: [],
  createdAt: new Date(),
  mapUrl: "https://res.cloudinary.com/dq1hjlghb/image/upload/v1/velociroute/sample_map.jpg", // Sample map in Cloudinary
  images: [
    "https://res.cloudinary.com/dq1hjlghb/image/upload/v1/velociroute/sample_ride1.jpg",
    "https://res.cloudinary.com/dq1hjlghb/image/upload/v1/velociroute/sample_ride2.jpg"
  ]
};

async function uploadDefaultImages() {
  try {
    // Upload default avatar if it doesn't exist
    const avatarResult = await cloudinary.uploader.upload(
      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
      { 
        folder: 'velociroute',
        public_id: 'default_avatar',
        overwrite: true
      }
    );
    console.log('Default avatar uploaded:', avatarResult.secure_url);

    // Upload sample map if it doesn't exist
    const mapResult = await cloudinary.uploader.upload(
      'https://i.imgur.com/XqKR2hZ.png', // Sample map image
      {
        folder: 'velociroute',
        public_id: 'sample_map',
        overwrite: true
      }
    );
    console.log('Sample map uploaded:', mapResult.secure_url);

    // Update the sample post with actual URLs
    samplePost.avatar = avatarResult.secure_url;
    samplePost.mapUrl = mapResult.secure_url;
    samplePost.images = [mapResult.secure_url]; // Using map as the only image for now
  } catch (error) {
    console.error('Error uploading default images:', error);
  }
}

async function createSamplePost() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    // First upload default images
    await uploadDefaultImages();

    // Then create the post
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('velocirouteDB');
    const posts = db.collection('posts');

    // Delete existing posts first
    await posts.deleteMany({});
    console.log('Cleared existing posts');

    const result = await posts.insertOne(samplePost);
    console.log('Sample post created with ID:', result.insertedId);
    
  } catch (error) {
    console.error('Error creating sample post:', error);
  } finally {
    await client.close();
  }
}

createSamplePost().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
