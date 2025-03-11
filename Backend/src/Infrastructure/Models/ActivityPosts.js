const { ObjectId } = require('mongodb');

class ActivityPost {
    constructor(data) {
        this.id = new ObjectId();
        this.userEmail = data.userEmail;
        this.activityName = data.activityName;
        this.description = data.description || '';
        this.activityType = data.activityType;
        this.rating = data.rating;
        this.difficulty = data.difficulty;
        this.images = data.images || [];
        this.route = data.route || null;
        this.stats = data.stats || null;
        this.likes = 0;
        this.comments = [];
        this.createdAt = new Date();
    }

    static getCollection(db) {
        return db.collection('posts'); 
    }

    static async createIndexes(db) {
        const collection = this.getCollection(db);
        await collection.createIndex({ userEmail: 1, createdAt: -1 });
        await collection.createIndex({ activityType: 1 });
        await collection.createIndex({ difficulty: 1 });
    }

    async save(db) {
        const collection = ActivityPost.getCollection(db);
        return await collection.insertOne(this);
    }

    static async findByUser(db, userEmail) {
        const collection = this.getCollection(db);
        return await collection.find({ userEmail }).sort({ createdAt: -1 }).toArray();
    }

    static async addLike(db, postId) {
        const collection = this.getCollection(db);
        return await collection.updateOne(
            { _id: new ObjectId(postId) },
            { $inc: { likes: 1 } }
        );
    }

    static async addComment(db, postId, comment) {
        const collection = this.getCollection(db);
        return await collection.updateOne(
            { _id: new ObjectId(postId) },
            { $push: { comments: { ...comment, createdAt: new Date() } } }
        );
    }
}

module.exports = ActivityPost;