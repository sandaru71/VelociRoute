const mongoose = require('mongoose');

let db;

const setupTestDB = async () => {
  try {
    const uri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/velociroute_test';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = mongoose.connection;
    console.log('Connected to test database');
    return db;
  } catch (error) {
    console.error('Error connecting to test database:', error);
    throw error;
  }
};

const clearTestDB = async () => {
  try {
    if (!mongoose.connection) {
      throw new Error('No database connection');
    }
    await mongoose.connection.dropDatabase();
    console.log('Test database cleared');
  } catch (error) {
    console.error('Error clearing test database:', error);
    throw error;
  }
};

const closeTestDB = async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    console.log('Closed test database connection');
  } catch (error) {
    console.error('Error closing test database:', error);
    throw error;
  }
};

module.exports = { setupTestDB, clearTestDB, closeTestDB };
