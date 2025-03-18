const admin = require('firebase-admin');

// Authentication middleware that validates Firebase token
const authenticateToken = async (req, res, next) => {
    // Log all headers for debugging
    console.log('Request headers:', req.headers);
    
    const authHeader = req.headers['authorization'];
    console.log('Auth header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // For development environments (localhost, emulator IPs)
        const devIPs = ['localhost', '127.0.0.1', '10.0.2.2', '10.137.28.196', '192.168.18.4'];
        const host = req.get('host');
        const hostWithoutPort = host ? host.split(':')[0] : '';
        console.log('Host:', host, 'Host without port:', hostWithoutPort);
        console.log('Is dev IP:', devIPs.includes(hostWithoutPort));
        
        if (devIPs.includes(hostWithoutPort)) {
            console.log('No token but in dev environment');
            return res.status(401).json({ error: 'No auth token provided' });
        }
        return res.status(401).json({ error: 'No auth token provided' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log('Decoded token:', decodedToken);

        // Set user email in request object
        req.user = { email: decodedToken.email };
        console.log('Set user email in request:', req.user.email);
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(403).json({ error: 'Invalid token' });
    }
};

module.exports = {
    authenticateToken
};
