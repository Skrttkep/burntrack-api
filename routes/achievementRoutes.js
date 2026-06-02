const express = require('express');

const {
  getAchievements,
} = require('../controllers/achievementController');

const {
  verifyToken,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, getAchievements);

module.exports = router;