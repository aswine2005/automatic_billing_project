const { v4: uuidv4 } = require('uuid');
const db = require('../data/db');
const { addActivity, getInvoiceActivity } = require('../services/activityService');
const { saveInvoicePdf } = require('../services/storageService');
const { sendReminderEmail } = require('../services/emailService');
const path = require('path');
const fs = require('fs');

const createInvoice = async (req, res, next) => {
  try {
    const { customerId, items, isRecurring } = req.body;
    if (!customerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'customerId and at least one item are required' });
    }

    const customer = db.customers.find(
      (c) => c.customerId === customerId && c.userId === req.user.userId
    );
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
      pdfFileName: null,
      isRecurring: Boolean(isRecurring),
      recurringInterval: isRecurring ? 'MONTHLY' : null,
      nextBillingDate: isRecurring
        ? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString()
        : null,
    };

    // Generate PDF and store URL
    const pdf = await saveInvoicePdf({ invoice, customer });
    invoice.pdfUrl = pdf.url;
    invoice.pdfFileName = pdf.fileName;

    db.invoices.push(invoice);

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
    let invoices = db.invoices.filter((inv) => inv.userId === req.user.userId);

    if (status) {
      invoices = invoices.filter((inv) => inv.status === status.toUpperCase());
    }

    res.json(invoices);
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

const sendInvoiceReminder = (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const invoice = db.invoices.find(
      (inv) => inv.invoiceId === invoiceId && inv.userId === req.user.userId
    );
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    invoice.lifecycleStatus = 'SENT';
    const customer = db.customers.find(
      (c) => c.customerId === invoice.customerId && c.userId === req.user.userId
    );
    const paid = db.payments
      .filter((p) => p.invoiceId === invoiceId)
      .reduce((sum, p) => sum + p.amount, 0);
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
    const invoice = db.invoices.find(
      (inv) => inv.invoiceId === invoiceId && inv.userId === req.user.userId
    );
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const fileName = invoice.pdfFileName || `invoice-${invoiceId}.pdf`;
    const filePath = path.join(__dirname, '..', '..', 'tmp-pdfs', fileName);

    // Generate on demand if missing
    if (!fs.existsSync(filePath)) {
      const customer = db.customers.find(
        (c) => c.customerId === invoice.customerId && c.userId === req.user.userId
      );
      return saveInvoicePdf({ invoice, customer })
        .then((pdf) => {
          invoice.pdfUrl = pdf.url;
          invoice.pdfFileName = pdf.fileName;
          return res.download(pdf.filePath, pdf.fileName);
        })
        .catch((e) => next(e));
    }

    return res.download(filePath, fileName);
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


