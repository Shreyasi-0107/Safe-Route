const express = require('express');
const router = express.Router();
router.get('/summary', require('../controllers/statsController').summary);
module.exports = router;