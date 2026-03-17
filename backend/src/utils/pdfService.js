const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Simulates S3 by saving PDFs to local /tmp-like folder and returning a URL-ish path.
const generateInvoicePdf = async (invoice, customer) => {
  const docsDir = path.join(__dirname, '..', '..', 'tmp-pdfs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const fileName = `invoice-${invoice.invoiceId}.pdf`;
  const filePath = path.join(docsDir, fileName);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

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

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  console.log('PDF generated at:', filePath);

  // In real S3, this would be an S3 URL. For local dev, serve from /pdfs.
  return { fileName, filePath, url: `/pdfs/${fileName}` };
};

module.exports = {
  generateInvoicePdf,
};

