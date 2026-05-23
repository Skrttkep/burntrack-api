const express = require('express');
const {
  getTodaySummary,
} = require('../controllers/summaryController');

const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/today', verifyToken, getTodaySummary);

module.exports = router;