const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const invoiceController = require('../controllers/invoiceController');

router.post('/', authMiddleware, invoiceController.createInvoice);
router.get('/invoices', authMiddleware, invoiceController.getInvoices);
router.get(
  '/:invoiceId/activity',
  authMiddleware,
  invoiceController.getInvoiceActivityTimeline
);
router.post(
  '/:invoiceId/remind',
  authMiddleware,
  invoiceController.sendInvoiceReminder
);
router.get(
  '/:invoiceId/download',
  authMiddleware,
  invoiceController.downloadInvoicePdf
);

module.exports = router;

