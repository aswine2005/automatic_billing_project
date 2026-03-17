const { v4: uuidv4 } = require('uuid');
const db = require('../data/db');

const createCustomer = (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const customer = {
      customerId: uuidv4(),
      userId: req.user.userId,
      name,
      email,
      phone: phone || '',
      createdAt: new Date().toISOString(),
    };

    db.customers.push(customer);
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
};

const getCustomers = (req, res, next) => {
  try {
    const { search } = req.query;
    let customers = db.customers.filter((c) => c.userId === req.user.userId);

    if (search) {
      const term = search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          (c.phone && c.phone.toLowerCase().includes(term))
      );
    }

    res.json(customers);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCustomer,
  getCustomers,
};

