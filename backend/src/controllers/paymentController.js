const { v4: uuidv4 } = require('uuid');
const dbService = require('../services/dbService');
const { addActivity } = require('../services/activityService');

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

const createPayment = async (req, res, next) => {
  try {
    const { invoiceId, amount, paymentDate } = req.body;
    if (!invoiceId || amount == null) {
      return res.status(400).json({ message: 'invoiceId and amount are required' });
    }

    const invoice = await dbService.findInvoiceById(req.user.userId, invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const existingPaid = await computePaidForInvoice(invoiceId);
    const remaining = invoice.totalAmount - existingPaid;
    const amt = Number(amount);
    if (amt <= 0) {
      return res.status(400).json({ message: 'amount must be greater than 0' });
    }
    if (amt > remaining) {
      return res.status(400).json({ message: 'Overpayment not allowed' });
    }

    const payment = {
      paymentId: uuidv4(),
      userId: req.user.userId,
      invoiceId,
      amount: amt,
      paymentDate: paymentDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
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
      type: 'PAYMENT_RECORDED',
      message: `Payment of $${payment.amount.toFixed(2)} recorded.`,
    });

    res.status(201).json({ payment, invoiceStatus: invoice.status });
  } catch (err) {
    next(err);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const payments = await dbService.listPaymentsByUser(req.user.userId);
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

const simulatePayment = async (req, res, next) => {
  try {
    const { invoiceId } = req.body;
    if (!invoiceId) {
      return res.status(400).json({ message: 'invoiceId is required' });
    }

    const invoice = await dbService.findInvoiceById(req.user.userId, invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const totalPaid = await computePaidForInvoice(invoiceId);

    const remaining = invoice.totalAmount - totalPaid;
    if (remaining <= 0) {
      return res.status(400).json({ message: 'Invoice already fully paid' });
    }

    const payment = {
      paymentId: uuidv4(),
      userId: req.user.userId,
      invoiceId,
      amount: remaining,
      paymentDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
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
      type: 'PAYMENT_SIMULATED',
      message: `Simulated payment of $${remaining.toFixed(2)} (gateway simulation).`,
    });

    res.status(201).json({ payment, invoiceStatus: invoice.status });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPayment,
  getPayments,
  simulatePayment,
};

