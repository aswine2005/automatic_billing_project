const PDFDocument = require('pdfkit');
const s3 = require('../config/s3Client');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const createInvoicePdfBuffer = async (invoice, customer) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];
  doc.on('data', (d) => chunks.push(d));

  // Header
  doc
    .fontSize(22)
    .fillColor('#111827')
    .text('Terraformers', { align: 'left' });
  doc
    .fontSize(10)
    .fillColor('#6B7280')
    .text('Terraformers Automated Billing System', { align: 'left' });
  doc.moveDown(1.2);

  doc
    .fontSize(18)
    .fillColor('#111827')
    .text('INVOICE', { align: 'left' });
  doc.moveDown(0.5);

  doc
    .fontSize(11)
    .fillColor('#111827')
    .text(`Invoice ID: ${invoice.invoiceId}`);
  doc
    .fontSize(11)
    .fillColor('#111827')
    .text(`Created: ${new Date(invoice.createdAt).toLocaleString()}`);
  if (invoice.dueDate) {
    doc
      .fontSize(11)
      .fillColor('#111827')
      .text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`);
  }
  doc.moveDown();

  if (customer) {
    doc
      .fontSize(12)
      .fillColor('#111827')
      .text('Bill To', { underline: true });
    doc
      .fontSize(11)
      .fillColor('#111827')
      .text(`${customer.name}`);
    doc
      .fontSize(11)
      .fillColor('#111827')
      .text(`${customer.email}`);
    if (customer.phone) {
      doc
        .fontSize(11)
        .fillColor('#111827')
        .text(`${customer.phone}`);
    }
    doc.moveDown(1);
  }

  // Items table
  const startX = doc.x;
  const tableTop = doc.y;
  const colDesc = startX;
  const colQty = startX + 300;
  const colUnit = startX + 360;
  const colTotal = startX + 450;

  doc
    .fontSize(11)
    .fillColor('#374151')
    .text('Description', colDesc, tableTop);
  doc.text('Qty', colQty, tableTop);
  doc.text('Unit', colUnit, tableTop);
  doc.text('Total', colTotal, tableTop);

  doc
    .moveTo(startX, tableTop + 15)
    .lineTo(startX + 520, tableTop + 15)
    .strokeColor('#E5E7EB')
    .stroke();

  let y = tableTop + 25;
  doc.fillColor('#111827').fontSize(10);

  invoice.items.forEach((item) => {
    const lineTotal = item.quantity * item.unitPrice;
    doc.text(String(item.description || 'Item'), colDesc, y, { width: 280 });
    doc.text(String(item.quantity), colQty, y);
    doc.text(`$${item.unitPrice.toFixed(2)}`, colUnit, y);
    doc.text(`$${lineTotal.toFixed(2)}`, colTotal, y);
    y += 18;
  });

  doc
    .moveTo(startX, y + 5)
    .lineTo(startX + 520, y + 5)
    .strokeColor('#E5E7EB')
    .stroke();

  doc
    .fontSize(12)
    .fillColor('#111827')
    .text(`Total (USD): $${invoice.totalAmount.toFixed(2)}`, colTotal - 120, y + 15, {
      align: 'right',
      width: 200,
    });

  // Footer
  doc
    .fontSize(9)
    .fillColor('#6B7280')
    .text(
      'For queries, contact: Aswin (aswinelaiya@gmail.com)',
      50,
      780,
      { align: 'center' }
    );

  doc.end();

  const pdfBuffer = await new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  return pdfBuffer;
};

// Upload PDF to S3 and return public URL
const generateInvoicePdf = async (invoice, customer) => {
  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  if (!bucket || !region) {
    const err = new Error('S3_BUCKET_NAME and AWS_REGION must be set');
    err.status = 500;
    throw err;
  }

  const pdfBuffer = await createInvoicePdfBuffer(invoice, customer);
  const key = `invoices/${invoice.invoiceId}.pdf`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    })
  );

  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  console.log('PDF uploaded to S3:', { bucket, key, url });

  return { key, url };
};

module.exports = {
  generateInvoicePdf,
};

