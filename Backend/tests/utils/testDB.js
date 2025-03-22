const mongoose = require('mongoose');

const setupTestDB = async () => {
  const uri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/velociroute_test';
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to test database');
};

const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  console.log('Closed test database connection');
};

module.exports = { setupTestDB, closeTestDB };
