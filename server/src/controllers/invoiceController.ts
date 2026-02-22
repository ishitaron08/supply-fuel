import { Response } from 'express';
import path from 'path';
import { Invoice } from '../models';
import { AuthRequest } from '../middleware/auth';
import { generateInvoice } from '../services/invoiceService';
import { UserRole } from 'shared';
import config from '../config';

export const getInvoiceByOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findOne({ orderId: req.params.orderId })
      .populate('orderId', 'orderNumber customerId')
      .populate('customerId', 'name email');

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findOne({ orderId: req.params.orderId });
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    const filePath = path.join(config.uploadDir, 'invoices', `${invoice.invoiceNumber}.pdf`);
    res.download(filePath, `${invoice.invoiceNumber}.pdf`);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const triggerInvoiceGeneration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoiceNumber = await generateInvoice(req.params.orderId);
    if (!invoiceNumber) {
      res.status(500).json({ success: false, message: 'Invoice generation failed.' });
      return;
    }
    res.json({ success: true, message: 'Invoice generated.', data: { invoiceNumber } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
