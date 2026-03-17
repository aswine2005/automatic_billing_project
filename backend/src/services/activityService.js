const { v4: uuidv4 } = require('uuid');
const db = require('../data/db');

const addActivity = ({ userId, invoiceId, type, message }) => {
  const activity = {
    activityId: uuidv4(),
    userId,
    invoiceId,
    type,
    message,
    createdAt: new Date().toISOString(),
  };
  db.activityLogs.push(activity);
  return activity;
};

const getInvoiceActivity = (userId, invoiceId) => {
  return db.activityLogs
    .filter((a) => a.userId === userId && a.invoiceId === invoiceId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

module.exports = {
  addActivity,
  getInvoiceActivity,
};

