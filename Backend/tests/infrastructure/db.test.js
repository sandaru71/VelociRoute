const { MongoClient } = require('mongodb');
const { connectToDatabase } = require('../../src/Infrastructure/db');

jest.mock('mongodb');

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should connect to MongoDB successfully', async () => {
    const mockDb = { collection: jest.fn() };
    const mockClient = {
      db: jest.fn().mockReturnValue(mockDb),
      connect: jest.fn().mockResolvedValue(true)
    };

    MongoClient.connect.mockResolvedValue(mockClient);

    const result = await connectToDatabase();
    
    expect(MongoClient.connect).toHaveBeenCalledWith(
      expect.stringContaining('mongodb'),
      expect.any(Object)
    );
    expect(result).toBe(mockDb);
  });

  it('should handle connection errors', async () => {
    const mockError = new Error('Connection failed');
    MongoClient.connect.mockRejectedValue(mockError);

    await expect(connectToDatabase()).rejects.toThrow('Connection failed');
  });

  it('should use correct connection options', async () => {
    const mockDb = { collection: jest.fn() };
    const mockClient = {
      db: jest.fn().mockReturnValue(mockDb),
      connect: jest.fn().mockResolvedValue(true)
    };

    MongoClient.connect.mockResolvedValue(mockClient);

    await connectToDatabase();

    expect(MongoClient.connect).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
    );
  });
});
