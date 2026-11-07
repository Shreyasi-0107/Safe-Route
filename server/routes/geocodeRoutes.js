const express = require('express');
const router = express.Router();
const { search } = require('../controllers/geocodeController');

router.get('/', search);
module.exports = router;