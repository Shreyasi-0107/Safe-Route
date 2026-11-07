// server/models/Incident.js
// Incident model - MAIN collection demonstrating MongoDB's flexible document model
// Different incident types store different metadata fields (showing NoSQL advantage)

const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Incident title is required'],
        trim: true,
        minlength: [5, 'Title must be at least 5 characters'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },

    // Type of incident - each type may have different metadata
    type: {
        type: String,
        required: [true, 'Incident type is required'],
        enum: {
            values: [
                'road_blocked',
                'waterlogging',
                'accident',
                'fire',
                'unsafe_area',
                'traffic_jam',
                'ambulance_access',
                'shelter_open',
                'shelter_closed',
                'other'
            ],
            message: '{VALUE} is not a valid incident type'
        }
    },

    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },

    // Severity levels with risk scores for route calculation
    // LOW=1, MEDIUM=3, HIGH=6, CRITICAL=10
    severity: {
        type: String,
        required: [true, 'Severity is required'],
        enum: {
            values: ['low', 'medium', 'high', 'critical'],
            message: '{VALUE} is not a valid severity level'
        },
        default: 'medium'
    },

    // Incident lifecycle status
    status: {
        type: String,
        enum: {
            values: ['active', 'resolved', 'expired', 'false_report'],
            message: '{VALUE} is not a valid status'
        },
        default: 'active'
    },

    // ============================================
    // GEOJSON LOCATION - 2dsphere index
    // ============================================
    // IMPORTANT: coordinates = [longitude, latitude] (NOT lat, lng)
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: [true, 'Location coordinates are required']
        },
        address: {
            type: String,
            trim: true
        }
    },

    // Reference to the user who reported this incident
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Community verification counts
    verificationCount: {
        type: Number,
        default: 0,
        min: 0
    },
    falseReportCount: {
        type: Number,
        default: 0,
        min: 0
    },

    // ============================================
    // FLEXIBLE METADATA - Demonstrates NoSQL advantage
    // ============================================
    // Different incident types store different data here
    // Example:
    //   waterlogging: { waterLevel: "2 feet", vehicleAccess: false }
    //   accident: { vehiclesInvolved: 2, injuriesReported: true }
    //   fire: { fireSize: "large", emergencyServicesCalled: true }
    // MongoDB handles this without schema changes - unlike relational DBs
    metadata: {
        type: mongoose.Schema.Types.Mixed, // Flexible field - any structure
        default: {}
    },

    // Image URL (optional, for future use)
    imageUrl: {
        type: String,
        trim: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    // ============================================
    // TTL INDEX FIELD
    // ============================================
    // MongoDB will automatically delete documents when this date is passed
    // The TTL index is defined below
    expiresAt: {
        type: Date,
        default: function () {
            // Default: incidents expire after 24 hours
            return new Date(Date.now() + 24 * 60 * 60 * 1000);
        }
    }
});

// ============================================
// INDEXES - Critical for performance
// ============================================

// 2dsphere index enables geospatial queries ($near, $geoNear, $geoWithin)
// REQUIRED for geospatial queries to work
IncidentSchema.index({ location: '2dsphere' });

// TTL Index: MongoDB automatically deletes documents when expiresAt is reached
// expireAfterSeconds: 0 means delete exactly at the expiresAt time
IncidentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Additional indexes for common queries
IncidentSchema.index({ type: 1 });           // Filter by type
IncidentSchema.index({ severity: 1 });       // Filter by severity
IncidentSchema.index({ status: 1 });         // Filter by status
IncidentSchema.index({ reportedBy: 1 });     // Find user's reports
IncidentSchema.index({ createdAt: -1 });     // Sort by newest first
IncidentSchema.index({ status: 1, severity: 1 }); // Compound index for dashboard

// ============================================
// VIRTUAL: Severity risk score for route calculation
// ============================================
IncidentSchema.virtual('riskScore').get(function () {
    const scores = { low: 1, medium: 3, high: 6, critical: 10 };
    return scores[this.severity] || 1;
});

// Enable virtuals in JSON output
IncidentSchema.set('toJSON', { virtuals: true });
IncidentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Incident', IncidentSchema);
