import { Response } from 'express';
import { SupplierBill } from '../models';
import { AuthRequest } from '../middleware/auth';

export const uploadBill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Bill file is required.' });
      return;
    }

    const bill = await SupplierBill.create({
      vendorName: req.body.vendorName,
      billNumber: req.body.billNumber,
      amount: parseFloat(req.body.amount),
      orderId: req.body.orderId || undefined,
      indentNumber: req.body.indentNumber || undefined,
      billFileUrl: `/uploads/bills/${req.file.filename}`,
      uploadedBy: req.user!.id,
    });

    res.status(201).json({ success: true, message: 'Supplier bill uploaded.', data: bill });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBills = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const [bills, total] = await Promise.all([
      SupplierBill.find()
        .populate('orderId', 'orderNumber')
        .populate('uploadedBy', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      SupplierBill.countDocuments(),
    ]);

    res.json({
      success: true,
      data: bills,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
