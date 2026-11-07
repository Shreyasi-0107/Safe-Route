// server/models/Verification.js
// Verification model - tracks when users confirm or deny an incident
// Prevents same user from verifying the same incident multiple times

const mongoose = require('mongoose');

const VerificationSchema = new mongoose.Schema({
    // Reference to the incident being verified
    incidentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Incident',
        required: [true, 'Incident ID is required']
    },

    // Reference to the user who verified
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },

    // Type of verification
    type: {
        type: String,
        enum: {
            values: ['confirm', 'false_report'],
            message: '{VALUE} is not a valid verification type'
        },
        required: [true, 'Verification type is required']
    },

    // Optional comment from verifier
    comment: {
        type: String,
        trim: true,
        maxlength: [200, 'Comment cannot exceed 200 characters']
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ============================================
// COMPOUND UNIQUE INDEX
// ============================================
// Prevents the same user from verifying the same incident twice
// This is an important MongoDB feature to demonstrate
VerificationSchema.index(
    { incidentId: 1, userId: 1 },
    { unique: true, name: 'unique_user_incident_verification' }
);

// Index for looking up verifications by incident
VerificationSchema.index({ incidentId: 1 });

// Index for looking up a user's verifications
VerificationSchema.index({ userId: 1 });

module.exports = mongoose.model('Verification', VerificationSchema);
