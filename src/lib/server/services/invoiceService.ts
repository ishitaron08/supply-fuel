import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { Invoice, Order, User, DeliverySite } from '../models';
import { generateInvoiceNumber } from '../utils/helpers';
import { sendInvoiceEmail } from './emailService';
import { uploadToCloudinary } from '../cloudinary';

/**
 * Collect a PDFDocument stream into a Buffer in memory.
 */
function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const passthrough = new PassThrough();
    doc.pipe(passthrough);
    passthrough.on('data', (chunk) => chunks.push(chunk));
    passthrough.on('end', () => resolve(Buffer.concat(chunks)));
    passthrough.on('error', reject);
  });
}

export const generateInvoice = async (
  orderId: string
): Promise<string | null> => {
  try {
    const order = await Order.findById(orderId)
      .populate('customerId')
      .populate('deliverySiteId');

    if (!order) {
      throw new Error('Order not found');
    }

    const customer = order.customerId as any;
    const site = order.deliverySiteId as any;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(Invoice);

    // Create PDF in memory
    const doc = new PDFDocument({ margin: 50 });
    const bufferPromise = pdfToBuffer(doc);

    // Header
    doc
      .fontSize(24)
      .fillColor('#1a56db')
      .text('FUEL ORDER PLATFORM', 50, 50)
      .fontSize(10)
      .fillColor('#666')
      .text('Tax Invoice', 50, 80);

    // Invoice details
    doc
      .fontSize(10)
      .fillColor('#333')
      .text(`Invoice #: ${invoiceNumber}`, 350, 50)
      .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 350, 65)
      .text(`Order #: ${order.orderNumber}`, 350, 80);

    // Divider
    doc.moveTo(50, 110).lineTo(550, 110).stroke('#e5e7eb');

    // Customer details
    doc
      .fontSize(12)
      .fillColor('#333')
      .text('Bill To:', 50, 130)
      .fontSize(10)
      .text(customer.name, 50, 150)
      .text(customer.organizationName || '', 50, 165)
      .text(customer.email, 50, 180)
      .text(customer.phone, 50, 195);

    if (customer.gstNumber) {
      doc.text(`GSTIN: ${customer.gstNumber}`, 50, 210);
    }

    // Delivery site
    doc
      .fontSize(12)
      .text('Delivery Site:', 350, 130)
      .fontSize(10)
      .text(site.siteName, 350, 150)
      .text(site.address, 350, 165)
      .text(`${site.city}, ${site.state} - ${site.pincode}`, 350, 180)
      .text(`Contact: ${site.contactPerson}`, 350, 195)
      .text(`Phone: ${site.contactPhone}`, 350, 210);

    // Table header
    const tableTop = 250;
    doc.rect(50, tableTop, 500, 25).fill('#1a56db');

    doc
      .fontSize(10)
      .fillColor('#fff')
      .text('Description', 60, tableTop + 7)
      .text('Qty (L)', 250, tableTop + 7)
      .text('Rate/L', 330, tableTop + 7)
      .text('Amount', 440, tableTop + 7);

    // Table row
    const baseAmount = order.pricePerLiter * order.quantityLiters;
    const rowTop = tableTop + 30;

    doc
      .fillColor('#333')
      .text(`${order.fuelType.charAt(0).toUpperCase() + order.fuelType.slice(1)} (${order.fuelType.toUpperCase()})`, 60, rowTop)
      .text(order.quantityLiters.toLocaleString('en-IN'), 250, rowTop)
      .text(`₹${order.pricePerLiter.toFixed(2)}`, 330, rowTop)
      .text(
        `₹${baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        440,
        rowTop
      );

    // Totals
    const totalsTop = rowTop + 40;
    doc.moveTo(350, totalsTop).lineTo(550, totalsTop).stroke('#e5e7eb');

    doc
      .text('Subtotal:', 350, totalsTop + 10)
      .text(
        `₹${baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        440,
        totalsTop + 10
      )
      .text(`GST (${order.gstPercentage}%):`, 350, totalsTop + 28)
      .text(
        `₹${order.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        440,
        totalsTop + 28
      );

    doc
      .moveTo(350, totalsTop + 48)
      .lineTo(550, totalsTop + 48)
      .stroke('#1a56db');

    doc
      .fontSize(12)
      .fillColor('#1a56db')
      .text('Total:', 350, totalsTop + 55)
      .text(
        `₹${order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        430,
        totalsTop + 55
      );

    // Payment info
    doc
      .fontSize(10)
      .fillColor('#333')
      .text(
        `Payment Mode: ${order.paymentMode.toUpperCase()}`,
        50,
        totalsTop + 55
      )
      .text(
        `Payment Status: ${order.paymentStatus.toUpperCase()}`,
        50,
        totalsTop + 70
      );

    // Footer
    doc
      .fontSize(8)
      .fillColor('#999')
      .text(
        'This is a computer-generated invoice and does not require a signature.',
        50,
        700,
        { align: 'center' }
      );

    doc.end();

    // Wait for PDF buffer
    const pdfBuffer = await bufferPromise;

    // Upload to Cloudinary
    const { url: pdfUrl } = await uploadToCloudinary(
      pdfBuffer,
      'invoices',
      invoiceNumber,
      'raw'
    );

    // Save invoice to DB
    const invoice = await Invoice.create({
      orderId: order._id,
      invoiceNumber,
      customerId: customer._id,
      pdfUrl,
      totalAmount: order.totalAmount,
      gstBreakdown: {
        baseAmount,
        gstPercentage: order.gstPercentage,
        gstAmount: order.gstAmount,
        totalAmount: order.totalAmount,
      },
      generatedAt: new Date(),
    });

    // Send email with invoice (attach buffer directly)
    const emailSent = await sendInvoiceEmail(
      customer.email,
      customer.name,
      order.orderNumber,
      invoiceNumber,
      pdfBuffer
    );

    if (emailSent) {
      invoice.emailSentAt = new Date();
      await invoice.save();
    }

    return invoiceNumber;
  } catch (error) {
    console.error('❌ Invoice generation error:', error);
    return null;
  }
};
