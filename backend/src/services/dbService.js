const docClient = require('../config/dynamoClient');
const {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const TABLES = {
  users: 'users',
  customers: 'customers',
  invoices: 'invoices',
  payments: 'payments',
};

const safeScanAll = async (params) => {
  const items = [];
  let ExclusiveStartKey = undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({ ...params, ExclusiveStartKey })
    );
    if (result.Items) items.push(...result.Items);
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
};

// USERS
const createUser = async (user) => {
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLES.users,
        Item: user,
        ConditionExpression: 'attribute_not_exists(userId)',
      })
    );
    return user;
  } catch (error) {
    console.error('DynamoDB error:', error);
    throw error;
  }
};

const getUserByEmail = async (email) => {
  try {
    const items = await safeScanAll({
      TableName: TABLES.users,
      FilterExpression: '#email = :email',
      ExpressionAttributeNames: { '#email': 'email' },
      ExpressionAttributeValues: { ':email': email },
    });
    return items[0] || null;
  } catch (error) {
    console.error('DynamoDB error:', error);
    throw error;
  }
};

// CUSTOMERS
const createCustomer = async (customer) => {
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLES.customers,
        Item: customer,
        ConditionExpression: 'attribute_not_exists(customerId)',
      })
    );
    return customer;
  } catch (error) {
    console.error('DynamoDB error:', error);
    throw error;
  }
};

const listCustomersByUser = async (userId) => {
  try {
    return await safeScanAll({
      TableName: TABLES.customers,
      FilterExpression: '#userId = :userId',
      ExpressionAttributeNames: { '#userId': 'userId' },
      ExpressionAttributeValues: { ':userId': userId },
    });
  } catch (error) {
    console.error('DynamoDB error:', error);
    throw error;
  }
};

const getCustomerById = async (userId, customerId) => {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLES.customers,
        Key: { customerId },
      })
    );
    const item = result.Item || null;
    if (!item || item.userId !== userId) return null;
    return item;
  } catch (error) {
    console.error('DynamoDB error:', error);
    throw error;
  }
};

// INVOICES
const createInvoice = async (invoice) => {
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLES.invoices,
        Item: invoice,
        ConditionExpression: 'attribute_not_exists(invoiceId)',
      })
    );
    return invoice;
  } catch (error) {
    console.error('DynamoDB error:', error);
    throw error;
  }
};

const listInvoicesByUser = async (userId, status) => {
  try {
    const params = {
      TableName: TABLES.invoices,
      FilterExpression: '#userId = :userId',
      ExpressionAttributeNames: { '#userId': 'userId' },
      ExpressionAttributeValues: { ':userId': userId },
    };
    let items = await safeScanAll(params);
    if (status) {
      const s = String(status).toUpperCase();
      items = items.filter((inv) => inv.status === s);
    }
    return items;
  } catch (error) {
    console.error('DynamoDB error:', error);
    throw error;
  }
};

const findInvoiceById = async (userId, invoiceId) => {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLES.invoices,
        Key: { invoiceId },
      })
    );
    const item = result.Item || null;
    if (!item || item.userId !== userId) return null;
    return item;
  } catch (error) {
    console.error('DynamoDB error:', error);
    throw error;
  }
};

const updateInvoice = async (invoiceId, updates) => {
  try {
    const names = {};
    const values = {};
    const sets = [];
    Object.entries(updates).forEach(([k, v]) => {
      names[`#${k}`] = k;
      values[`:${k}`] = v;
      sets.push(`#${k} = :${k}`);
    });

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLES.invoices,
        Key: { invoiceId },
        UpdateExpression: `SET ${sets.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      })
    );
    return result.Attributes;
  } catch (error) {
    console.error('DynamoDB error:', error);
    throw error;
  }
};

// PAYMENTS
const recordPayment = async (payment) => {
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLES.payments,
        Item: payment,
        ConditionExpression: 'attribute_not_exists(paymentId)',
      })
    );
    return payment;
  } catch (error) {
    console.error('DynamoDB error:', error);
    throw error;
  }
};

const listPaymentsByUser = async (userId) => {
  try {
    return await safeScanAll({
      TableName: TABLES.payments,
      FilterExpression: '#userId = :userId',
      ExpressionAttributeNames: { '#userId': 'userId' },
      ExpressionAttributeValues: { ':userId': userId },
    });
  } catch (error) {
    console.error('DynamoDB error:', error);
    throw error;
  }
};

const listPaymentsByInvoice = async (invoiceId) => {
  try {
    return await safeScanAll({
      TableName: TABLES.payments,
      FilterExpression: '#invoiceId = :invoiceId',
      ExpressionAttributeNames: { '#invoiceId': 'invoiceId' },
      ExpressionAttributeValues: { ':invoiceId': invoiceId },
    });
  } catch (error) {
    console.error('DynamoDB error:', error);
    throw error;
  }
};

// Recurring billing simulation (scan-based; for production, add GSIs)
const processRecurringInvoices = async (userId) => {
  try {
    const now = new Date();
    const templates = await safeScanAll({
      TableName: TABLES.invoices,
      FilterExpression:
        '#userId = :userId AND #isRecurring = :true AND #recurringInterval = :monthly AND attribute_exists(#nextBillingDate)',
      ExpressionAttributeNames: {
        '#userId': 'userId',
        '#isRecurring': 'isRecurring',
        '#recurringInterval': 'recurringInterval',
        '#nextBillingDate': 'nextBillingDate',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':true': true,
        ':monthly': 'MONTHLY',
      },
    });

    for (const template of templates) {
      if (!template.nextBillingDate) continue;
      if (new Date(template.nextBillingDate) > now) continue;

      const due = new Date(now);
      due.setDate(due.getDate() + 7);
      const invoiceId = require('uuid').v4();
      const clone = {
        ...template,
        invoiceId,
        createdAt: new Date().toISOString(),
        status: 'UNPAID',
        lifecycleStatus: 'CREATED',
        dueDate: due.toISOString(),
        isRecurring: false,
        recurringInterval: null,
        nextBillingDate: null,
      };

      await createInvoice(clone);

      const next = new Date(now);
      next.setMonth(next.getMonth() + 1);
      await updateInvoice(template.invoiceId, { nextBillingDate: next.toISOString() });
    }
  } catch (error) {
    console.error('DynamoDB error:', error);
    throw error;
  }
};

module.exports = {
  // users
  createUser,
  getUserByEmail,
  // customers
  createCustomer,
  listCustomersByUser,
  getCustomerById,
  // invoices
  createInvoice,
  listInvoicesByUser,
  findInvoiceById,
  updateInvoice,
  // payments
  recordPayment,
  listPaymentsByUser,
  listPaymentsByInvoice,
  // automation
  processRecurringInvoices,
};

