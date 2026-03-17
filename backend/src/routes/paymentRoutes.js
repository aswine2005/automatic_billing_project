const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

router.post('/', authMiddleware, paymentController.createPayment);
router.post('/simulate', authMiddleware, paymentController.simulatePayment);
router.get('/payments', authMiddleware, paymentController.getPayments);

module.exports = router;

