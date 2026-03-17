// Thin abstraction layer over the in-memory db.
// In production, replace these with DynamoDB calls.

const db = require('../data/db');

const listUserInvoices = (userId) =>
  db.invoices.filter((inv) => inv.userId === userId);

const listUserPayments = (userId) =>
  db.payments.filter((p) => p.userId === userId);

const listUserCustomers = (userId) =>
  db.customers.filter((c) => c.userId === userId);

const findInvoiceById = (userId, invoiceId) =>
  db.invoices.find((inv) => inv.userId === userId && inv.invoiceId === invoiceId);

const updateInvoice = (invoice) => {
  const idx = db.invoices.findIndex((inv) => inv.invoiceId === invoice.invoiceId);
  if (idx !== -1) {
    db.invoices[idx] = invoice;
  }
  return invoice;
};

const createPayment = (payment) => {
  db.payments.push(payment);
  return payment;
};

const processRecurringInvoices = (userId) => {
  const now = new Date();

  db.invoices
    .filter(
      (inv) =>
        inv.userId === userId &&
        inv.isRecurring &&
        inv.recurringInterval === 'MONTHLY' &&
        inv.nextBillingDate &&
        new Date(inv.nextBillingDate) <= now
    )
    .forEach((template) => {
      const due = new Date(now);
      due.setDate(due.getDate() + 7);
      const clone = {
        ...template,
        invoiceId: require('uuid').v4(),
        createdAt: new Date().toISOString(),
        status: 'UNPAID',
        lifecycleStatus: 'CREATED',
        dueDate: due.toISOString(),
        // Preserve template subscription settings, but don't make child invoices generate further invoices
        isRecurring: false,
        recurringInterval: null,
        nextBillingDate: null,
      };
      db.invoices.push(clone);

      const next = new Date(now);
      next.setMonth(next.getMonth() + 1);
      template.nextBillingDate = next.toISOString();
    });
};

module.exports = {
  listUserInvoices,
  listUserPayments,
  listUserCustomers,
  findInvoiceById,
  updateInvoice,
  createPayment,
  processRecurringInvoices,
};

