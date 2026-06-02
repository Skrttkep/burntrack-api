const express = require('express');

const {
  getAdminSummary,
  getAllUsers,
  getUserDetail,
  getAllActivities,
  getUserStatistics,
} = require('../controllers/adminController');

const {
  verifyToken,
  verifyAdmin,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/summary', verifyToken, verifyAdmin, getAdminSummary);
router.get('/users', verifyToken, verifyAdmin, getAllUsers);
router.get('/users/:id', verifyToken, verifyAdmin, getUserDetail);
router.get('/users/:id/statistics', verifyToken, verifyAdmin, getUserStatistics);
router.get('/activities', verifyToken, verifyAdmin, getAllActivities);

module.exports = router;