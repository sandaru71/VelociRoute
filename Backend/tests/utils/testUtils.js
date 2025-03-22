const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let connection;
let db;

const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  connection = await MongoClient.connect(mongoUri);
  db = connection.db();
  return { mongoServer, connection, db };
};

const closeTestDB = async () => {
  if (connection) await connection.close();
  if (mongoServer) await mongoServer.stop();
};

const clearCollections = async (db) => {
  const collections = await db.listCollections().toArray();
  for (const collection of collections) {
    await db.collection(collection.name).deleteMany({});
  }
};

const mockRequest = (overrides = {}) => ({
  query: {},
  body: {},
  files: [],
  app: { locals: { db } },
  ...overrides
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

module.exports = {
  setupTestDB,
  closeTestDB,
  clearCollections,
  mockRequest,
  mockResponse
};
