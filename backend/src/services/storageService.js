// Storage abstraction (AWS-ready).
// Today: local PDF generation + local file path URL.
// Later: swap to S3 putObject/getSignedUrl without changing controllers.

const { generateInvoicePdf } = require('../utils/pdfService');

const saveInvoicePdf = async ({ invoice, customer }) => {
  return await generateInvoicePdf(invoice, customer);
};

module.exports = {
  saveInvoicePdf,
};

