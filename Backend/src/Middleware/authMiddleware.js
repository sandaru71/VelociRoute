// Temporary middleware for development
const authenticateToken = (req, res, next) => {
    // Set a test user email for development
    req.user = { email: 'test@example.com' };
    next();
};

module.exports = {
    authenticateToken
};
