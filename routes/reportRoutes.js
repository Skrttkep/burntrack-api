const express = require('express');

const {
  getWeeklyReport,
} = require('../controllers/reportController');

const {
  verifyToken,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/weekly', verifyToken, getWeeklyReport);

module.exports = router;