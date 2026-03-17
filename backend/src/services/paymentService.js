const Razorpay = require('razorpay');
const crypto = require('crypto');

const getRazorpayClient = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    const err = new Error('Razorpay keys are not configured in environment variables');
    err.status = 500;
    throw err;
  }
  return new Razorpay({ key_id, key_secret });
};

const createRazorpayOrder = async ({ amountInSmallestUnit, currency, receipt, notes }) => {
  const razorpay = getRazorpayClient();
  return await razorpay.orders.create({
    amount: amountInSmallestUnit,
    currency,
    receipt,
    notes,
  });
};

const verifyRazorpaySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac('sha256', key_secret).update(body).digest('hex');
  return expected === razorpay_signature;
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
};

