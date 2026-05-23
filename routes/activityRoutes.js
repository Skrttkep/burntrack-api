const express = require('express');
const {
  createActivity,
  getActivities,
  getActivityById,
  deleteActivity,
} = require('../controllers/activityController');

const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', verifyToken, createActivity);
router.get('/', verifyToken, getActivities);
router.get('/:id', verifyToken, getActivityById);
router.delete('/:id', verifyToken, deleteActivity);

module.exports = router;