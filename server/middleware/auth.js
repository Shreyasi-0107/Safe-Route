// server/middleware/auth.js
// JWT authentication middleware - protects routes that require login

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // No token found
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Please login to continue.'
        });
    }

    try {
        // Verify the token using our JWT secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user from the decoded token ID
        // We exclude the password field (select: false in schema also handles this)
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Please login again.'
            });
        }

        if (!req.user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated.'
            });
        }

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token has expired. Please login again.' });
        }
        return res.status(500).json({ success: false, message: 'Server error during authentication.' });
    }
};

// Optional auth - attaches user if token present, but doesn't block if missing
const optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = { protect, optionalAuth };
