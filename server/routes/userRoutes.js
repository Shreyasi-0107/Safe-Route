// server/routes/userRoutes.js
// User profile and notification routes

const express = require('express');
const router = express.Router();
const { getProfile, getNotifications, getUnreadNotificationCount } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// All user routes require authentication
router.get('/profile', protect, getProfile);
router.get('/notifications', protect, getNotifications);
router.get('/notifications/count', protect, getUnreadNotificationCount);

module.exports = router;
