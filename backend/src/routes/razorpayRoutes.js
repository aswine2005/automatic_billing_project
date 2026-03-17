const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');
const { addActivity } = require('../services/activityService');
const { createRazorpayOrder, verifyRazorpaySignature } = require('../services/paymentService');
const { sendPaymentConfirmationEmail } = require('../services/emailService');
const dbService = require('../services/dbService');

const USD_TO_INR = 83; // static conversion rate (demo)

const computePaidForInvoice = async (invoiceId) => {
  const payments = await dbService.listPaymentsByInvoice(invoiceId);
  return payments.reduce((sum, p) => sum + p.amount, 0);
};

const updateInvoiceStatusFromPayments = async (invoice) => {
  const totalPaid = await computePaidForInvoice(invoice.invoiceId);
  if (totalPaid <= 0) {
    invoice.status = 'UNPAID';
  } else if (totalPaid < invoice.totalAmount) {
    invoice.status = 'PARTIALLY_PAID';
  } else {
    invoice.status = 'PAID';
    invoice.lifecycleStatus = 'PAID';
  }
  return { totalPaid };
};

// POST /create-order
// Input: { invoiceId }
router.post('/create-order', authMiddleware, async (req, res, next) => {
  try {
    const { invoiceId } = req.body;
    if (!invoiceId) return res.status(400).json({ message: 'invoiceId is required' });

    const invoice = await dbService.findInvoiceById(req.user.userId, invoiceId);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const totalPaid = await computePaidForInvoice(invoiceId);
    const remainingUsd = invoice.totalAmount - totalPaid;
    if (remainingUsd <= 0) {
      return res.status(400).json({ message: 'Invoice already fully paid' });
    }

    // Razorpay primarily operates with INR for India businesses.
    // We keep invoice totals in USD (base) and convert for payment.
    const amountInr = Math.round(remainingUsd * USD_TO_INR * 100); // paise
    if (amountInr <= 0) {
      return res.status(400).json({ message: 'Invalid remaining amount' });
    }

    const order = await createRazorpayOrder({
      amountInSmallestUnit: amountInr,
      currency: 'INR',
      receipt: `inv_${invoiceId}`,
      notes: { invoiceId, userId: req.user.userId, remainingUsd: remainingUsd.toFixed(2) },
    });

    res.json({
      order,
      invoice: {
        invoiceId: invoice.invoiceId,
        totalAmountUsd: invoice.totalAmount,
        totalPaidUsd: totalPaid,
        remainingUsd,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /verify-payment
// Input: { razorpay_payment_id, razorpay_order_id, razorpay_signature, invoiceId }
router.post('/verify-payment', authMiddleware, async (req, res, next) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, invoiceId } = req.body;
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !invoiceId) {
      return res.status(400).json({ message: 'Missing payment verification fields' });
    }

    const invoice = await dbService.findInvoiceById(req.user.userId, invoiceId);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    const customer = await dbService.getCustomerById(req.user.userId, invoice.customerId);

    const isValid = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // In a real integration, you would fetch payment details from Razorpay
    // and verify the amount/currency. Here we trust the order flow and
    // record the remaining balance in USD as paid.
    const totalPaid = await computePaidForInvoice(invoiceId);
    const remainingUsd = invoice.totalAmount - totalPaid;
    if (remainingUsd <= 0) {
      return res.status(400).json({ message: 'Invoice already fully paid' });
    }

    const payment = {
      paymentId: uuidv4(),
      userId: req.user.userId,
      invoiceId,
      amount: Number(remainingUsd.toFixed(2)), // store in USD base
      paymentDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      provider: 'RAZORPAY',
      razorpay: {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      },
    };
    await dbService.recordPayment(payment);

    await updateInvoiceStatusFromPayments(invoice);
    await dbService.updateInvoice(invoice.invoiceId, {
      status: invoice.status,
      lifecycleStatus: invoice.lifecycleStatus,
    });

    addActivity({
      userId: req.user.userId,
      invoiceId,
      type: 'PAYMENT_VERIFIED',
      message: 'Razorpay payment verified and recorded.',
    });

    // Email goes to the CUSTOMER, not the logged-in user.
    if (customer?.email) {
      try {
        const emailResult = await sendPaymentConfirmationEmail({
          to: customer.email,
          invoiceId,
          paidAmount: payment.amount,
          remainingAmount: Math.max(0, invoice.totalAmount - (await computePaidForInvoice(invoiceId))),
          status: invoice.status,
        });
        addActivity({
          userId: req.user.userId,
          invoiceId,
          type: emailResult.ok ? 'EMAIL_SENT' : 'EMAIL_FAILED',
          message: emailResult.ok
            ? `Payment confirmation email sent to ${customer.email}.`
            : `Payment email failed to send to ${customer.email}.`,
        });
      } catch (e) {
        // do not crash payment flow
      }
    }

    res.status(201).json({ payment, invoice });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

