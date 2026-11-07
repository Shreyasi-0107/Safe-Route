// server/middleware/admin.js
// Admin authorization middleware - only allows admin users

// This middleware must be used AFTER the 'protect' middleware
// So req.user is already set when this runs
const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }

    next(); // User is admin, proceed
};

module.exports = { adminOnly };
