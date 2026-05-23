const express = require('express');
const {
  createOrUpdateTarget,
  getTarget,
} = require('../controllers/targetController');

const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', verifyToken, createOrUpdateTarget);
router.get('/', verifyToken, getTarget);

module.exports = router;