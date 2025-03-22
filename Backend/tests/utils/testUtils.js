const mongoose = require('mongoose');

// Mock request object with auth token
const mockRequest = (data = {}) => {
  return {
    ...data,
    body: data.body || {},
    query: data.query || {},
    params: data.params || {},
    headers: {
      authorization: 'Bearer valid-token',
      ...data.headers
    },
    user: data.user || {
      uid: 'test-uid',
      email: 'test@example.com'
    }
  };
};

// Mock response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Mock next function
const mockNext = jest.fn();

// Clear all collections in the test database
const clearCollections = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
};

// Create test data
const createTestData = async (Model, data) => {
  const documents = Array.isArray(data) ? data : [data];
  return await Model.create(documents);
};

// Delete test data
const deleteTestData = async (Model) => {
  await Model.deleteMany({});
};

module.exports = {
  mockRequest,
  mockResponse,
  mockNext,
  clearCollections,
  createTestData,
  deleteTestData
};
