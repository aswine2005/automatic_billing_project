// In-memory data store simulating DynamoDB tables
// In production, replace with DynamoDB client calls.

module.exports = {
  users: [], // { userId, name, email, passwordHash, createdAt }
  customers: [], // { customerId, userId, name, email, phone, createdAt }
  invoices: [], // { invoiceId, userId, customerId, items, totalAmount, status, lifecycleStatus, createdAt, dueDate, pdfUrl, isRecurring, recurringInterval, nextBillingDate }
  payments: [], // { paymentId, userId, invoiceId, amount, paymentDate, createdAt }
  activityLogs: [], // { activityId, userId, invoiceId, type, message, createdAt }
};


