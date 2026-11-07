// server/controllers/authController.js
// Handles user registration, login, and profile retrieval

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper: Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Helper: one canonical form for emails, so "Test@Gmail.com " and
// "test@gmail.com" are the same account
const normalizeEmail = (email) => String(email).trim().toLowerCase();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helper: password rules. Returns an error message, or null if the password is fine.
// (Rules are enforced here, not in the model, so seeded demo accounts still work.)
const checkPassword = (pw) => {
    if (pw.length < 8) return 'Password must be at least 8 characters.';
    if (pw.length > 64) return 'Password must be 64 characters or fewer.';
    if (!/[A-Z]/.test(pw)) return 'Password needs at least one uppercase letter (A-Z).';
    if (!/[a-z]/.test(pw)) return 'Password needs at least one lowercase letter (a-z).';
    if (!/[0-9]/.test(pw)) return 'Password needs at least one number (0-9).';
    return null;
};

// ============================================
// POST /api/auth/register
// Register a new user
// ============================================
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password'
            });
        }

        // Only plain text is accepted (blocks objects such as { "$gt": "" })
        if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password must be text.'
            });
        }

        const cleanName = name.trim();
        const cleanEmail = normalizeEmail(email);

        if (cleanName.length < 2 || cleanName.length > 60) {
            return res.status(400).json({
                success: false,
                message: 'Name must be between 2 and 60 characters.'
            });
        }

        if (!EMAIL_PATTERN.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address.'
            });
        }

        const passwordProblem = checkPassword(password);
        if (passwordProblem) {
            return res.status(400).json({ success: false, message: passwordProblem });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists. Please log in instead.'
            });
        }

        // Create new user (password will be hashed by the pre-save middleware)
        const user = await User.create({ name: cleanName, email: cleanEmail, password });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                reputation: user.reputation,
                reputationLabel: user.getReputationLabel()
            }
        });

    } catch (error) {
        // Two people registering the same email at the same moment:
        // the unique index rejects the second one
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists. Please log in instead.'
            });
        }
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join('. ') });
        }
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

// ============================================
// POST /api/auth/login
// Login with email and password
// ============================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Email and password must be text.'
            });
        }

        // Find user and include password (normally excluded)
        const user = await User.findOne({ email: normalizeEmail(email) }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Compare password using bcrypt
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                reputation: user.reputation,
                reputationLabel: user.getReputationLabel(),
                reportsCount: user.reportsCount
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

// ============================================
// GET /api/auth/me
// Get current logged-in user profile
// ============================================
const getMe = async (req, res) => {
    try {
        // req.user is set by the protect middleware
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

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
            }
        });

    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { register, login, getMe };