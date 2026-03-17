const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const customerController = require('../controllers/customerController');

router.post('/', authMiddleware, customerController.createCustomer);
router.get('/customers', authMiddleware, customerController.getCustomers);

module.exports = router;

