// server/models/Shelter.js
// Shelter model - stores emergency shelters with geospatial location

const mongoose = require('mongoose');

const ShelterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Shelter name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },

    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
        maxlength: [200, 'Address cannot exceed 200 characters']
    },

    // Total capacity of the shelter
    capacity: {
        type: Number,
        required: [true, 'Capacity is required'],
        min: [1, 'Capacity must be at least 1']
    },

    // Current number of people in the shelter
    currentOccupancy: {
        type: Number,
        default: 0,
        min: 0
    },

    // Shelter availability status
    status: {
        type: String,
        enum: {
            values: ['open', 'full', 'closed'],
            message: '{VALUE} is not a valid status'
        },
        default: 'open'
    },

    // Contact information
    contact: {
        phone: { type: String, trim: true },
        name: { type: String, trim: true }
    },

    // GeoJSON Point location
    // IMPORTANT: coordinates = [longitude, latitude]
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
        }
    },

    // Available facilities at this shelter
    facilities: [{
        type: String,
        enum: ['Food', 'Water', 'First Aid', 'Electricity', 'Beds', 'Toilets', 'Medical Staff', 'WiFi']
    }],

    // Additional notes
    notes: {
        type: String,
        trim: true,
        maxlength: [300, 'Notes cannot exceed 300 characters']
    },

    // Who added this shelter
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before every save
ShelterSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// ============================================
// INDEXES
// ============================================
// 2dsphere index for geospatial queries
ShelterSchema.index({ location: '2dsphere' });

// Status index for filtering open shelters
ShelterSchema.index({ status: 1 });

// Virtual: available spots
ShelterSchema.virtual('availableSpots').get(function () {
    return Math.max(0, this.capacity - this.currentOccupancy);
});

ShelterSchema.set('toJSON', { virtuals: true });
ShelterSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Shelter', ShelterSchema);
