import nodemailer from 'nodemailer';
import config from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: false,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path: string;
    contentType?: string;
  }>;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    if (!config.smtpUser) {
      console.log(`📧 [DEV] Email to ${options.to}: ${options.subject}`);
      return true;
    }

    await transporter.sendMail({
      from: `"Fuel Order Platform" <${config.smtpUser}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    console.log(`✅ Email sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error);
    return false;
  }
};

export const sendOTPEmail = async (to: string, name: string, otp: string): Promise<boolean> => {
  return sendEmail({
    to,
    subject: 'Verify Your Account - Fuel Order Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a56db;">Fuel Order Platform</h2>
        <p>Hi ${name},</p>
        <p>Your OTP for account verification is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a56db;">${otp}</span>
        </div>
        <p>This OTP expires in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">Fuel Order Platform &copy; ${new Date().getFullYear()}</p>
      </div>
    `,
  });
};

export const sendOrderConfirmationEmail = async (
  to: string,
  name: string,
  orderNumber: string,
  details: { quantity: number; total: number; deliveryDate: string; site: string }
): Promise<boolean> => {
  return sendEmail({
    to,
    subject: `Order Confirmed - ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a56db;">Order Confirmation</h2>
        <p>Hi ${name},</p>
        <p>Your fuel order has been placed successfully!</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order #:</strong> ${orderNumber}</p>
          <p><strong>Quantity:</strong> ${details.quantity} Liters</p>
          <p><strong>Total Amount:</strong> ₹${details.total.toLocaleString('en-IN')}</p>
          <p><strong>Delivery Date:</strong> ${details.deliveryDate}</p>
          <p><strong>Delivery Site:</strong> ${details.site}</p>
        </div>
        <p>You will be notified once the admin approves your order.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">Fuel Order Platform &copy; ${new Date().getFullYear()}</p>
      </div>
    `,
  });
};

export const sendOrderStatusEmail = async (
  to: string,
  name: string,
  orderNumber: string,
  status: string,
  message: string
): Promise<boolean> => {
  return sendEmail({
    to,
    subject: `Order ${orderNumber} - ${status}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a56db;">Order Update</h2>
        <p>Hi ${name},</p>
        <p>${message}</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order #:</strong> ${orderNumber}</p>
          <p><strong>Status:</strong> ${status}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">Fuel Order Platform &copy; ${new Date().getFullYear()}</p>
      </div>
    `,
  });
};

export const sendInvoiceEmail = async (
  to: string,
  name: string,
  orderNumber: string,
  invoiceNumber: string,
  pdfPath: string
): Promise<boolean> => {
  return sendEmail({
    to,
    subject: `Invoice ${invoiceNumber} - Order ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a56db;">Invoice Generated</h2>
        <p>Hi ${name},</p>
        <p>Your invoice for order <strong>${orderNumber}</strong> has been generated.</p>
        <p>Please find the invoice attached to this email.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
          <p><strong>Order #:</strong> ${orderNumber}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">Fuel Order Platform &copy; ${new Date().getFullYear()}</p>
      </div>
    `,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        path: pdfPath,
        contentType: 'application/pdf',
      },
    ],
  });
};
