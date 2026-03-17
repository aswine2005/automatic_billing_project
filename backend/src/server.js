require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const razorpayRoutes = require('./routes/razorpayRoutes');
const { sendEmail, verifySmtpConnection } = require('./services/emailService');

const app = express();
const allowedOrigins = ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// PDFs are stored in S3; no local static serving needed

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'automated-billing-backend' });
});

// SMTP debug route (helps validate Mailtrap/Gmail SMTP independently)
app.get('/test-email', async (req, res, next) => {
  try {
    if (req.query.verify === 'true') {
      const result = await verifySmtpConnection();
      return res.status(result.ok ? 200 : 500).json(result.ok ? { message: 'SMTP verified' } : { message: 'SMTP verify failed', error: result.error });
    }
    const to = req.query.to;
    if (!to) return res.status(400).json({ message: 'Provide ?to=email' });
    const result = await sendEmail({
      to,
      subject: 'Terraformers SMTP Test',
      text: 'Terraformers Automated Billing System\n\nThis is a test email.\n\nFor any queries, contact Aswin at aswinelaiya@gmail.com',
    });
    if (!result.ok) {
      return res.status(500).json({ message: 'Test email failed', error: result.error });
    }
    res.json({ message: 'Test email sent', to });
  } catch (err) {
    next(err);
  }
});

app.use('/auth', authRoutes);
app.use('/customer', customerRoutes);
app.use('/invoice', invoiceRoutes);
app.use('/payment', paymentRoutes);
app.use('/report', reportRoutes);
app.use('/', razorpayRoutes);

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API server running on http://0.0.0.0:${PORT}`);
    console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
  });
}

// Export for tests / future hosting wrappers
module.exports = app;
