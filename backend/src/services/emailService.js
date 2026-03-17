const nodemailer = require('nodemailer');

const COMPANY = 'Terraformers';
const FOOTER =
  'For any queries, contact Aswin at aswinelaiya@gmail.com';

const getTransporter = () => {
  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
  const { SMTP_USER, SMTP_PASS } = process.env;

  console.log('SMTP CONFIG:', {
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER,
  });

  if (!SMTP_USER || !SMTP_PASS) {
    const err = new Error('SMTP is not configured in environment variables');
    err.status = 500;
    throw err;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
};

const sendEmail = async ({ to, subject, text }) => {
  const transporter = getTransporter();
  console.log('Sending email via Gmail to:', to);
  try {
    const info = await transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        `${COMPANY} Billing <no-reply@terraformers.local>`,
      to,
      subject,
      text,
    });
    console.log('Email sent successfully via Gmail');
    console.log('Email sent successfully to:', to);
    return { ok: true, info };
  } catch (err) {
    console.error('Email error:', err);
    // Fallback: never crash app on email failure
    return { ok: false, error: err?.message || String(err) };
  }
};

const verifySmtpConnection = async () => {
  const transporter = getTransporter();
  try {
    await transporter.verify();
    console.log('SMTP verify successful');
    return { ok: true };
  } catch (err) {
    console.error('SMTP verify error:', err);
    return { ok: false, error: err?.message || String(err) };
  }
};

const sendPaymentConfirmationEmail = async ({
  to,
  invoiceId,
  paidAmount,
  remainingAmount,
  status,
}) => {
  const subject = `${COMPANY}: Payment received for Invoice ${invoiceId}`;
  const text = [
    `${COMPANY} Automated Billing System`,
    '',
    `Invoice ID: ${invoiceId}`,
    `Paid amount: $${Number(paidAmount).toFixed(2)} USD`,
    `Remaining amount: $${Number(remainingAmount).toFixed(2)} USD`,
    `Status: ${status}`,
    '',
    FOOTER,
  ].join('\n');
  return await sendEmail({ to, subject, text });
};

const sendReminderEmail = async ({ to, invoiceId, remainingAmount, status }) => {
  const subject = `${COMPANY}: Payment reminder for Invoice ${invoiceId}`;
  const text = [
    `${COMPANY} Automated Billing System`,
    '',
    `Invoice ID: ${invoiceId}`,
    `Remaining amount: $${Number(remainingAmount).toFixed(2)} USD`,
    `Status: ${status}`,
    '',
    'This is a reminder to complete your payment at the earliest.',
    '',
    FOOTER,
  ].join('\n');
  return await sendEmail({ to, subject, text });
};

module.exports = {
  sendEmail,
  verifySmtpConnection,
  sendPaymentConfirmationEmail,
  sendReminderEmail,
};

