// server/routes/incidentRoutes.js
// All incident-related API endpoints

const express = require('express');
const router = express.Router();
const {
    createIncident,
    getIncidents,
    getNearbyIncidents,
    getIncidentById,
    updateIncident,
    deleteIncident,
    verifyIncident
} = require('../controllers/incidentController');
const { protect, optionalAuth } = require('../middleware/auth');

// IMPORTANT: Route order matters!
// Specific routes must come BEFORE parameterized routes (:id)

// GET /api/incidents/nearby - Find incidents near a location
router.get('/nearby', getNearbyIncidents);

// GET /api/incidents - Get all incidents (public)
router.get('/', optionalAuth, getIncidents);

// POST /api/incidents - Create a new incident (requires login)
router.post('/', protect, createIncident);

// GET /api/incidents/:id - Get single incident
router.get('/:id', getIncidentById);

// PUT /api/incidents/:id - Update incident (owner or admin)
router.put('/:id', protect, updateIncident);

// DELETE /api/incidents/:id - Delete incident (owner or admin)
router.delete('/:id', protect, deleteIncident);

// POST /api/incidents/:id/verify - Verify or dispute an incident
router.post('/:id/verify', protect, verifyIncident);

module.exports = router;
