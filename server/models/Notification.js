// server/models/Notification.js
// Notification model - stores system notifications for users

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    // Who receives this notification
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },

    // Notification message
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: [300, 'Message cannot exceed 300 characters']
    },

    // Type of notification
    type: {
        type: String,
        enum: ['report_confirmed', 'report_denied', 'verification_received', 'system', 'shelter_update'],
        default: 'system'
    },

    // Whether user has read it
    isRead: {
        type: Boolean,
        default: false
    },

    // Optional link to the related incident or shelter
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relatedModel'
    },

    relatedModel: {
        type: String,
        enum: ['Incident', 'Shelter']
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for finding a user's notifications quickly
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
