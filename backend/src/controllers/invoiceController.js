const { v4: uuidv4 } = require('uuid');
const dbService = require('../services/dbService');
const { addActivity, getInvoiceActivity } = require('../services/activityService');
const { saveInvoicePdf } = require('../services/storageService');
const { sendReminderEmail } = require('../services/emailService');

const createInvoice = async (req, res, next) => {
  try {
    const { customerId, items, isRecurring } = req.body;
    if (!customerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'customerId and at least one item are required' });
    }

    const customer = await dbService.getCustomerById(req.user.userId, customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const normalizedItems = items.map((item) => ({
      description: item.description || 'Item',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
    }));

    const totalAmount = normalizedItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + 7);
    const invoice = {
      invoiceId: uuidv4(),
      userId: req.user.userId,
      customerId,
      items: normalizedItems,
      totalAmount,
      status: 'UNPAID',
      lifecycleStatus: 'CREATED',
      createdAt: now.toISOString(),
      dueDate: due.toISOString(),
      pdfUrl: null,
      pdfKey: null,
      isRecurring: Boolean(isRecurring),
      recurringInterval: isRecurring ? 'MONTHLY' : null,
      nextBillingDate: isRecurring
        ? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString()
        : null,
    };

    // Generate PDF and store URL
    const pdf = await saveInvoicePdf({ invoice, customer });
    invoice.pdfUrl = pdf.url;
    invoice.pdfKey = pdf.key;

    await dbService.createInvoice(invoice);

    addActivity({
      userId: req.user.userId,
      invoiceId: invoice.invoiceId,
      type: 'INVOICE_CREATED',
      message: `Invoice created for customer ${customer.name}`,
    });

    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
};

const getInvoices = (req, res, next) => {
  try {
    const { status } = req.query;
    dbService
      .listInvoicesByUser(req.user.userId, status)
      .then((invoices) => res.json(invoices))
      .catch(next);
  } catch (err) {
    next(err);
  }
};

const getInvoiceActivityTimeline = (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const timeline = getInvoiceActivity(req.user.userId, invoiceId);
    res.json(timeline);
  } catch (err) {
    next(err);
  }
};

const sendInvoiceReminder = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await dbService.findInvoiceById(req.user.userId, invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    invoice.lifecycleStatus = 'SENT';
    await dbService.updateInvoice(invoice.invoiceId, { lifecycleStatus: 'SENT' });

    const customer = await dbService.getCustomerById(req.user.userId, invoice.customerId);
    const payments = await dbService.listPaymentsByInvoice(invoiceId);
    const paid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, invoice.totalAmount - paid);

    addActivity({
      userId: req.user.userId,
      invoiceId,
      type: 'REMINDER_SENT',
      message: 'Payment reminder sent to customer (SMTP).',
    });

    if (customer?.email) {
      sendReminderEmail({
        to: customer.email,
        invoiceId,
        remainingAmount: remaining,
        status: invoice.status,
      })
        .then(() => {
          addActivity({
            userId: req.user.userId,
            invoiceId,
            type: 'EMAIL_SENT',
            message: `Reminder email sent to ${customer.email}.`,
          });
        })
        .catch(() => {
          addActivity({
            userId: req.user.userId,
            invoiceId,
            type: 'EMAIL_FAILED',
            message: `Reminder email failed to send to ${customer.email}.`,
          });
        });
    }

    res.json({ message: 'Reminder sent', invoice });
  } catch (err) {
    next(err);
  }
};

const downloadInvoicePdf = (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    return dbService
      .findInvoiceById(req.user.userId, invoiceId)
      .then(async (invoice) => {
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // If missing, generate on-demand and persist the S3 URL.
        if (!invoice.pdfUrl) {
          const customer = await dbService.getCustomerById(req.user.userId, invoice.customerId);
          const pdf = await saveInvoicePdf({ invoice, customer });
          invoice.pdfUrl = pdf.url;
          invoice.pdfKey = pdf.key;
          await dbService.updateInvoice(invoice.invoiceId, { pdfUrl: pdf.url, pdfKey: pdf.key });
        }

        return res.redirect(invoice.pdfUrl);
      })
      .catch(next);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceActivityTimeline,
  sendInvoiceReminder,
  downloadInvoicePdf,
};


