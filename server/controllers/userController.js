// server/controllers/userController.js
// User profile operations

const User = require('../models/User');
const Incident = require('../models/Incident');
const Notification = require('../models/Notification');

// ============================================
// GET /api/users/profile
// Get current user's full profile with their reports
// ============================================
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        // Get user's recent incidents
        const recentIncidents = await Incident.find({ reportedBy: req.user._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('title type severity status createdAt verificationCount');

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                reputation: user.reputation,
                reputationLabel: user.getReputationLabel(),
                reportsCount: user.reportsCount,
                verifiedReportsCount: user.verifiedReportsCount,
                incorrectReportsCount: user.incorrectReportsCount,
                createdAt: user.createdAt
            },
            recentIncidents
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// GET /api/users/notifications
// Get user's notifications
// ============================================
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);

        // Mark all as read
        await Notification.updateMany(
            { userId: req.user._id, isRead: false },
            { isRead: true }
        );

        res.json({
            success: true,
            count: notifications.length,
            notifications
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// GET /api/users/notifications/count
// Get count of unread notifications
// ============================================
const getUnreadNotificationCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.user._id,
            isRead: false
        });

        res.json({ success: true, unreadCount: count });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getProfile, getNotifications, getUnreadNotificationCount };
