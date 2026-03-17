const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/db');

const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = db.users.find((u) => u.email === email);
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      userId: uuidv4(),
      name,
      email,
      passwordHash: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    db.users.push(user);

    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET || 'dev_jwt_secret',
      { expiresIn: '12h' }
    );

    res.status(201).json({
      token,
      user: { userId: user.userId, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = db.users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET || 'dev_jwt_secret',
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: { userId: user.userId, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  signup,
  login,
};

