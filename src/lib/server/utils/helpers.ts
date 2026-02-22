import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config';
import { ORDER_PREFIX, INVOICE_PREFIX } from '@/lib/shared';

export const generateAccessToken = (payload: {
  id: string;
  email: string;
  role: string;
  name: string;
}): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
};

export const generateRefreshToken = (payload: { id: string }): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as any,
  });
};

export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

export const generateOrderNumber = async (Order: any): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `${ORDER_PREFIX}-${dateStr}`;

  const lastOrder = await Order.findOne({
    orderNumber: { $regex: `^${prefix}` },
  })
    .sort({ orderNumber: -1 })
    .lean();

  let seq = 1;
  if (lastOrder) {
    const lastSeq = parseInt(
      lastOrder.orderNumber.split('-').pop() || '0',
      10
    );
    seq = lastSeq + 1;
  }

  return `${prefix}-${seq.toString().padStart(3, '0')}`;
};

export const generateInvoiceNumber = async (
  Invoice: any
): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `${INVOICE_PREFIX}-${dateStr}`;

  const lastInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^${prefix}` },
  })
    .sort({ invoiceNumber: -1 })
    .lean();

  let seq = 1;
  if (lastInvoice) {
    const lastSeq = parseInt(
      lastInvoice.invoiceNumber.split('-').pop() || '0',
      10
    );
    seq = lastSeq + 1;
  }

  return `${prefix}-${seq.toString().padStart(3, '0')}`;
};
