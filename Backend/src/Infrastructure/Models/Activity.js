const { ObjectId } = require('mongodb');

class Activity {
  constructor(data) {
    this._id = new ObjectId();
    this.userEmail = data.userEmail;
    this.activityName = data.activityName;
    this.description = data.description || '';
    this.activityType = data.activityType;
    this.rating = data.rating;
    this.difficulty = data.difficulty;
    this.images = data.images || [];
    this.route = data.route || null;
    this.stats = data.stats || null;
    this.createdAt = new Date();
  }

  static getCollection(db) {
    return db.collection('activities');
  }

  static async createIndexes(db) {
    const collection = this.getCollection(db);
    await collection.createIndex({ userEmail: 1, createdAt: -1 });
  }

  async save(db) {
    const collection = Activity.getCollection(db);
    return await collection.insertOne(this);
  }
}

module.exports = Activity;
