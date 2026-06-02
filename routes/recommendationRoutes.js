const express = require('express');

const {
  getTodayRecommendations,
} = require('../controllers/recommendationController');

const {
  verifyToken,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/today', verifyToken, getTodayRecommendations);

module.exports = router;