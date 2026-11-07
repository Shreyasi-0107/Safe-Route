// server/controllers/incidentController.js
// Handles all incident CRUD operations and geospatial queries

const Incident = require('../models/Incident');
const Verification = require('../models/Verification');
const User = require('../models/User');
const Notification = require('../models/Notification');

// How long a normal incident stays active, in hours.
// High and critical incidents stay for twice as long.
// Set INCIDENT_TTL_HOURS in .env (default 72 hours).
const TTL_HOURS = parseInt(process.env.INCIDENT_TTL_HOURS || '72', 10);

// Duplicate protection: the same type of incident, within this distance and
// time window, still active, is treated as the same incident.
const DUPLICATE_RADIUS_METERS = 150;
const DUPLICATE_WINDOW_HOURS = 6;
const EARTH_RADIUS_METERS = 6378137;

// ============================================
// POST /api/incidents
// Create a new incident report
// ============================================
const createIncident = async (req, res) => {
    try {
        const {
            title, type, description, severity,
            longitude, latitude, address, metadata
        } = req.body;

        // Validate required fields
        if (!title || !type || !description || !severity || !longitude || !latitude) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: title, type, description, severity, and location'
            });
        }

        // Coordinates must be real numbers inside valid ranges
        const lng = parseFloat(longitude);
        const lat = parseFloat(latitude);
        if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            return res.status(400).json({
                success: false,
                message: 'Please choose a valid location on the map.'
            });
        }

        // Duplicate protection: same type, close by, recent and still active.
        // $geoWithin + $centerSphere works with or without a 2dsphere index.
        const nearbyFilter = {
            status: 'active',
            type,
            createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000) },
            location: {
                $geoWithin: {
                    $centerSphere: [[lng, lat], DUPLICATE_RADIUS_METERS / EARTH_RADIUS_METERS]
                }
            }
        };

        // 1) The same person already reported it
        const ownDuplicate = await Incident.findOne({ ...nearbyFilter, reportedBy: req.user._id });
        if (ownDuplicate) {
            return res.status(409).json({
                success: false,
                duplicate: true,
                duplicateOf: ownDuplicate._id,
                message: 'You have already reported this incident. Thank you - there is no need to report it again.'
            });
        }

        // 2) Someone else already reported it: ask the user to confirm it instead
        const otherDuplicate = await Incident.findOne(nearbyFilter);
        if (otherDuplicate) {
            return res.status(409).json({
                success: false,
                duplicate: true,
                duplicateOf: otherDuplicate._id,
                message: 'This incident has already been reported nearby. Please open the Live Map and confirm it instead.'
            });
        }

        // Expiry: high/critical incidents last twice as long as the others
        const isSerious = severity === 'high' || severity === 'critical';
        const ttlHours = isSerious ? TTL_HOURS * 2 : TTL_HOURS;
        const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

        // Create the incident document
        const incident = await Incident.create({
            title,
            type,
            description,
            severity,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)], // [lng, lat]
                address: address || ''
            },
            reportedBy: req.user._id,
            metadata: metadata || {},
            expiresAt
        });

        // Update user's report count
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { reportsCount: 1 }
        });

        res.status(201).json({
            success: true,
            message: 'Incident reported successfully!',
            incident
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join('. ') });
        }
        console.error('Create incident error:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

// ============================================
// GET /api/incidents
// Get all active incidents (with filters)
// ============================================
const getIncidents = async (req, res) => {
    try {
        const {
            type, severity, status,
            page = 1, limit = 50
        } = req.query;

        // Build query filter
        const filter = {};

        // By default show only active incidents
        filter.status = status || 'active';

        if (type) filter.type = type;
        if (severity) filter.severity = severity;

        // Keep paging values sane (limit is capped at 100)
        const pageNum = Math.max(parseInt(page) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const incidents = await Incident.find(filter)
            .populate('reportedBy', 'name reputation') // Join with users collection
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Incident.countDocuments(filter);

        res.json({
            success: true,
            count: incidents.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            incidents
        });

    } catch (error) {
        console.error('Get incidents error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// GET /api/incidents/nearby
// Find incidents near a location using $near
// ============================================
const getNearbyIncidents = async (req, res) => {
    try {
        const { longitude, latitude, maxDistance = 5000 } = req.query;

        if (!longitude || !latitude) {
            return res.status(400).json({
                success: false,
                message: 'Please provide longitude and latitude'
            });
        }

        // MongoDB $near geospatial query
        // Finds documents near the given point, sorted by distance (closest first)
        // Requires the 2dsphere index on location field
        const incidents = await Incident.find({
            status: 'active',
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(maxDistance) // Distance in meters
                }
            }
        })
            .populate('reportedBy', 'name reputation')
            .limit(20);

        res.json({
            success: true,
            count: incidents.length,
            incidents
        });

    } catch (error) {
        console.error('Nearby incidents error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// GET /api/incidents/:id
// Get a single incident by ID
// ============================================
const getIncidentById = async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id)
            .populate('reportedBy', 'name reputation createdAt');

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }

        res.json({ success: true, incident });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid incident ID format' });
        }
        console.error('Get incident error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// PUT /api/incidents/:id
// Update an incident (owner or admin)
// ============================================
const updateIncident = async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);

        if (!incident) {
            return res.status(404).json({ success: false, message: 'Incident not found' });
        }

        // Only owner or admin can update
        if (incident.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own incidents'
            });
        }

        const allowedUpdates = ['title', 'description', 'severity', 'status', 'metadata'];
        const updates = {};
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        const updatedIncident = await Incident.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({ success: true, message: 'Incident updated', incident: updatedIncident });

    } catch (error) {
        console.error('Update incident error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// DELETE /api/incidents/:id
// Delete an incident (owner or admin)
// ============================================
const deleteIncident = async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);

        if (!incident) {
            return res.status(404).json({ success: false, message: 'Incident not found' });
        }

        // Only owner or admin can delete
        if (incident.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own incidents'
            });
        }

        await Incident.findByIdAndDelete(req.params.id);
        // Also delete related verifications
        await Verification.deleteMany({ incidentId: req.params.id });

        // Reduce user's report count
        await User.findByIdAndUpdate(incident.reportedBy, {
            $inc: { reportsCount: -1 }
        });

        res.json({ success: true, message: 'Incident deleted successfully' });

    } catch (error) {
        console.error('Delete incident error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// POST /api/incidents/:id/verify
// Verify or dispute an incident
// ============================================
const verifyIncident = async (req, res) => {
    try {
        const { type } = req.body; // 'confirm' or 'false_report'
        const incidentId = req.params.id;
        const userId = req.user._id;

        if (!type || !['confirm', 'false_report'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid verification type: confirm or false_report'
            });
        }

        const incident = await Incident.findById(incidentId);
        if (!incident) {
            return res.status(404).json({ success: false, message: 'Incident not found' });
        }

        // Check if user is trying to verify their own report
        if (incident.reportedBy.toString() === userId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot verify your own incident report'
            });
        }

        // Try to create verification - will fail if duplicate (compound unique index)
        try {
            await Verification.create({ incidentId, userId, type });
        } catch (dupError) {
            if (dupError.code === 11000) { // MongoDB duplicate key error
                return res.status(400).json({
                    success: false,
                    message: 'You have already verified this incident'
                });
            }
            throw dupError;
        }

        // Update incident verification counts
        if (type === 'confirm') {
            await Incident.findByIdAndUpdate(incidentId, {
                $inc: { verificationCount: 1 }
            });

            // Reward the reporter: +5 reputation for confirmed report
            await User.findByIdAndUpdate(incident.reportedBy, {
                $inc: { reputation: 5, verifiedReportsCount: 1 }
            });

            // Reward the verifier: +2 reputation for verifying
            await User.findByIdAndUpdate(userId, {
                $inc: { reputation: 2 }
            });

            // Send notification to reporter
            await Notification.create({
                userId: incident.reportedBy,
                message: `Your incident "${incident.title}" was confirmed by another user. +5 reputation!`,
                type: 'report_confirmed',
                relatedId: incidentId,
                relatedModel: 'Incident'
            });

        } else {
            await Incident.findByIdAndUpdate(incidentId, {
                $inc: { falseReportCount: 1 }
            });

            // Penalize reporter: -3 reputation for false report
            await User.findByIdAndUpdate(incident.reportedBy, {
                $inc: { reputation: -3, incorrectReportsCount: 1 }
            });
        }

        res.json({
            success: true,
            message: type === 'confirm' ? 'Incident confirmed!' : 'Incident reported as incorrect'
        });

    } catch (error) {
        console.error('Verify incident error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = {
    createIncident,
    getIncidents,
    getNearbyIncidents,
    getIncidentById,
    updateIncident,
    deleteIncident,
    verifyIncident
};