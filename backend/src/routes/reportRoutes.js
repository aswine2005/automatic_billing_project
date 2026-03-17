const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

router.get('/', authMiddleware, reportController.getReport);

module.exports = router;

