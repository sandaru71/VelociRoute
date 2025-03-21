const { admin, getFirebaseApp } = require('../Config/firebase');

// Authentication middleware that validates Firebase token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ 
                success: false, 
                message: 'No authorization header' 
            });
        }

        // Get the ID token
        const token = authHeader.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        try {
            // Initialize Firebase if not already initialized
            getFirebaseApp();
            
            // Verify the token
            const decodedToken = await admin.auth().verifyIdToken(token);
            req.user = decodedToken;
            console.log('User authenticated:', decodedToken.uid);
            next();
        } catch (error) {
            console.error('Token verification failed:', error);
            return res.status(403).json({ 
                success: false, 
                message: 'Invalid token',
                error: error.message 
            });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Authentication failed',
            error: error.message 
        });
    }
};

module.exports = { authenticateToken };
