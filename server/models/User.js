// server/models/User.js
// User model - stores registered users with roles and reputation

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Do not return password by default in queries
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    // Reputation system - simple point-based
    reputation: {
        type: Number,
        default: 0,
        min: 0
    },
    // Track user's reporting activity
    reportsCount: {
        type: Number,
        default: 0
    },
    verifiedReportsCount: {
        type: Number,
        default: 0
    },
    incorrectReportsCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ============================================
// MIDDLEWARE: Hash password before saving
// ============================================
// This runs before every save() call
// It checks if password was modified (new user or password change)
UserSchema.pre('save', async function (next) {
    // Only hash password if it was modified
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Generate a salt with 12 rounds (higher = more secure but slower)
        const salt = await bcrypt.genSalt(12);
        // Hash the password with the salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ============================================
// METHOD: Compare password during login
// ============================================
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// ============================================
// METHOD: Get reputation label
// ============================================
UserSchema.methods.getReputationLabel = function () {
    if (this.reputation >= 50) return 'Highly Trusted Reporter';
    if (this.reputation >= 20) return 'Trusted Reporter';
    return 'New Reporter';
};

// ============================================
// INDEXES
// ============================================
// email unique index is created by unique: true above
// Additional index for role (for admin queries)
UserSchema.index({ role: 1 });
UserSchema.index({ reputation: -1 }); // For finding top reporters

module.exports = mongoose.model('User', UserSchema);
