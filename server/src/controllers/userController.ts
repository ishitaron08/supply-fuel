import { Response } from 'express';
import { User } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allowedFields = [
      'name', 'phone', 'organizationName', 'gstNumber',
      'profileType', 'address', 'city', 'state',
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.user!.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({ success: true, message: 'Profile updated.', data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: List all customers
export const listCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const filter: any = { role: 'customer' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { organizationName: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: List delivery partners
export const listDeliveryPartners = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partners = await User.find({ role: 'delivery_partner' }).sort({ createdAt: -1 });
    res.json({ success: true, data: partners });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Create delivery partner account
export const createDeliveryPartner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bcrypt = await import('bcryptjs');
    const { name, email, phone, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already registered.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const partner = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'delivery_partner',
      isVerified: true,
    });

    res.status(201).json({
      success: true,
      message: 'Delivery partner created.',
      data: { id: partner._id, name: partner.name, email: partner.email },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
