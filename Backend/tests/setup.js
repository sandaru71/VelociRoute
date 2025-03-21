const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Import all mocks
require('./mocks/models');
require('./mocks/services');

let mongoServer;
let connection;
let db;

// Configure test environment
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Create connection to in-memory database for MongoDB native client
  connection = await MongoClient.connect(mongoUri);
  db = connection.db();
  
  // Connect mongoose to the memory server
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  // Make db available globally for tests
  global.__MONGO_URI__ = mongoUri;
  global.__MONGO_DB__ = db;
  global.__MONGO_CONNECTION__ = connection;
});

afterAll(async () => {
  // Clean up
  if (mongoose.connection) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (connection) await connection.close();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  if (db) {
    const collections = await db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
  
  // Clear all mongoose collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
  
  // Clear all mocks
  jest.clearAllMocks();
});
