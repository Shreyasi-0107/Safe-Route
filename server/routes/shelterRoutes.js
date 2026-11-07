// server/routes/shelterRoutes.js
// Shelter API endpoints

const express = require('express');
const router = express.Router();
const {
    getShelters,
    getNearbyShelters,
    getShelterById,
    createShelter,
    updateShelter,
    deleteShelter
} = require('../controllers/shelterController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// GET /api/shelters/nearby - must be before /:id
router.get('/nearby', getNearbyShelters);

// GET /api/shelters - Get all shelters (public)
router.get('/', getShelters);

// GET /api/shelters/:id - Get single shelter (public)
router.get('/:id', getShelterById);

// POST /api/shelters - Add shelter (admin only)
router.post('/', protect, adminOnly, createShelter);

// PUT /api/shelters/:id - Update shelter (admin only)
router.put('/:id', protect, adminOnly, updateShelter);

// DELETE /api/shelters/:id - Delete shelter (admin only)
router.delete('/:id', protect, adminOnly, deleteShelter);

module.exports = router;
