const { getDb } = require('../db');

const USER_COLLECTION = 'users';

const createUserProfile = async (userData) => {
  const db = await getDb();
  const collection = db.collection(USER_COLLECTION);
  
  const user = {
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    sport: userData.sport,
    location: userData.location,
    profileImage: userData.profileImage,
    profileThumbnail: userData.profileThumbnail,
    coverImage: userData.coverImage,
    followers: [],
    following: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return await collection.insertOne(user);
};

const updateUserProfile = async (email, userData) => {
  const db = await getDb();
  const collection = db.collection(USER_COLLECTION);
  
  const update = {
    $set: {
      ...userData,
      updatedAt: new Date()
    }
  };

  return await collection.updateOne({ email }, update, { upsert: true });
};

const getUserProfile = async (email) => {
  const db = await getDb();
  const collection = db.collection(USER_COLLECTION);
  return await collection.findOne({ email });
};

const getUserActivities = async (email) => {
  const db = await getDb();
  const collection = db.collection('activities');
  return await collection.find({ userEmail: email })
    .sort({ createdAt: -1 })
    .toArray();
};

module.exports = {
  createUserProfile,
  updateUserProfile,
  getUserProfile,
  getUserActivities
};
