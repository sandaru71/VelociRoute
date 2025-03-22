const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Import all mocks
require('./mocks/models');
require('./mocks/services');

// Configure test environment
process.env.NODE_ENV = 'test';

let mongoServer;

beforeAll(async () => {
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect mongoose to the memory server
  await mongoose.connect(mongoUri);

  // Make db available globally for tests
  global.__MONGO_URI__ = mongoUri;
  global.__MONGO_DB__ = mongoose.connection.db;
});

afterAll(async () => {
  // Clean up
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
  
  // Clear all mocks
  jest.clearAllMocks();
});
