// server/routes/routeRoutes.js
// Route calculation API endpoint

const express = require('express');
const router = express.Router();
const { calculateRoute } = require('../controllers/routeController');
const { optionalAuth } = require('../middleware/auth');

// POST /api/routes/calculate - Calculate route with risk analysis
router.post('/calculate', optionalAuth, calculateRoute);

module.exports = router;
