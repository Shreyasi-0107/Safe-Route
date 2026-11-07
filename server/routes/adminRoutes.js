// server/routes/adminRoutes.js
// Admin-only routes for statistics and management

const express = require('express');
const router = express.Router();
const {
    getStatistics,
    getAllUsers,
    getAllIncidents,
    updateIncidentStatus,
    adminDeleteIncident,
    updateUserRole
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// All admin routes require: 1) valid JWT, 2) admin role
router.use(protect);
router.use(adminOnly);

// Statistics
router.get('/statistics', getStatistics);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);

// Incidents
router.get('/incidents', getAllIncidents);
router.put('/incidents/:id/status', updateIncidentStatus);
router.delete('/incidents/:id', adminDeleteIncident);

module.exports = router;
