const express = require('express');

const {
  getAchievements,
  getAchievementHistory,
  claimAchievement,
} = require('../controllers/achievementController');

const {
  verifyToken,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
  '/',
  verifyToken,
  getAchievements,
);

router.get(
  '/history',
  verifyToken,
  getAchievementHistory,
);

router.post(
  '/:id/claim',
  verifyToken,
  claimAchievement,
);

module.exports = router;