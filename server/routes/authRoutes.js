// server/routes/authRoutes.js
// Authentication routes: register, login, get current user

const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// POST /api/auth/register - Create new account
router.post('/register', register);

// POST /api/auth/login - Login with email/password
router.post('/login', login);

// GET /api/auth/me - Get current user (requires valid JWT)
router.get('/me', protect, getMe);

module.exports = router;
