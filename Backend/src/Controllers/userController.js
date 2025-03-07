const { ObjectId } = require('mongodb');

const getUserProfile = async (req, res, db) => {
    try {
        const { email } = req.params;
        const user = await db.collection('users').findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUserProfile = async (req, res, db) => {
    try {
        const { email } = req.params;
        const updateData = {
            ...req.body,
            updatedAt: new Date()
        };

        const result = await db.collection('users').updateOne(
            { email },
            { $set: updateData },
            { upsert: true }
        );

        if (result.acknowledged) {
            const updatedUser = await db.collection('users').findOne({ email });
            res.status(200).json(updatedUser);
        } else {
            res.status(400).json({ message: 'Failed to update profile' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile
};
