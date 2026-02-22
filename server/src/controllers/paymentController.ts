import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

export const createRazorpayOrder = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(410).json({
    success: false,
    message: 'Online payment is disabled. This platform currently supports Cash on Delivery only.',
  });
};

export const verifyPayment = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(410).json({
    success: false,
    message: 'Payment verification is disabled. This platform currently supports Cash on Delivery only.',
  });
};
