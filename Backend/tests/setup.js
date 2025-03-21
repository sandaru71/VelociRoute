const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let connection;
let db;

beforeAll(async () => {
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Create connection to in-memory database
  connection = await MongoClient.connect(mongoUri);
  db = connection.db();
  
  // Make db available globally for tests
  global.__MONGO_URI__ = mongoUri;
  global.__MONGO_DB__ = db;
  global.__MONGO_CONNECTION__ = connection;
});

afterAll(async () => {
  // Clean up
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
});
