// server/controllers/shelterController.js
// Handles all shelter operations including geospatial nearby queries

const Shelter = require('../models/Shelter');

// ============================================
// GET /api/shelters
// Get all shelters (with optional status filter)
// ============================================
const getShelters = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status) filter.status = status;

        const shelters = await Shelter.find(filter)
            .populate('addedBy', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: shelters.length, shelters });

    } catch (error) {
        console.error('Get shelters error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// GET /api/shelters/nearby
// Find shelters near a location using $near
// ============================================
const getNearbyShelters = async (req, res) => {
    try {
        const { longitude, latitude, maxDistance = 10000 } = req.query;

        if (!longitude || !latitude) {
            return res.status(400).json({
                success: false,
                message: 'Please provide longitude and latitude'
            });
        }

        // MongoDB geospatial $near query
        // Requires the 2dsphere index on shelter's location field
        const shelters = await Shelter.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            }
        }).limit(10);

        res.json({ success: true, count: shelters.length, shelters });

    } catch (error) {
        console.error('Nearby shelters error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// GET /api/shelters/:id
// Get a single shelter
// ============================================
const getShelterById = async (req, res) => {
    try {
        const shelter = await Shelter.findById(req.params.id)
            .populate('addedBy', 'name');

        if (!shelter) {
            return res.status(404).json({ success: false, message: 'Shelter not found' });
        }

        res.json({ success: true, shelter });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid shelter ID' });
        }
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// POST /api/shelters
// Create a new shelter (admin only)
// ============================================
const createShelter = async (req, res) => {
    try {
        const {
            name, address, capacity, status,
            contact, longitude, latitude,
            facilities, notes
        } = req.body;

        if (!name || !address || !capacity || !longitude || !latitude) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, address, capacity, and location'
            });
        }

        const shelter = await Shelter.create({
            name,
            address,
            capacity: parseInt(capacity),
            status: status || 'open',
            contact: contact || {},
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            facilities: facilities || [],
            notes: notes || '',
            addedBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Shelter added successfully!',
            shelter
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join('. ') });
        }
        console.error('Create shelter error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// PUT /api/shelters/:id
// Update a shelter (admin only)
// ============================================
const updateShelter = async (req, res) => {
    try {
        const allowedUpdates = ['name', 'address', 'capacity', 'currentOccupancy', 'status', 'contact', 'facilities', 'notes'];
        const updates = {};
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        // If location is being updated
        if (req.body.longitude && req.body.latitude) {
            updates.location = {
                type: 'Point',
                coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
            };
        }

        const shelter = await Shelter.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!shelter) {
            return res.status(404).json({ success: false, message: 'Shelter not found' });
        }

        res.json({ success: true, message: 'Shelter updated', shelter });

    } catch (error) {
        console.error('Update shelter error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// DELETE /api/shelters/:id
// Delete a shelter (admin only)
// ============================================
const deleteShelter = async (req, res) => {
    try {
        const shelter = await Shelter.findByIdAndDelete(req.params.id);

        if (!shelter) {
            return res.status(404).json({ success: false, message: 'Shelter not found' });
        }

        res.json({ success: true, message: 'Shelter deleted successfully' });

    } catch (error) {
        console.error('Delete shelter error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getShelters, getNearbyShelters, getShelterById, createShelter, updateShelter, deleteShelter };
