import { Response } from 'express';
import { DeliverySite } from '../models';
import { AuthRequest } from '../middleware/auth';

export const createSite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const site = await DeliverySite.create({
      ...req.body,
      userId: req.user!.id,
    });
    res.status(201).json({ success: true, message: 'Delivery site created.', data: site });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sites = await DeliverySite.find({ userId: req.user!.id, isActive: true })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: sites });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSiteById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const site = await DeliverySite.findOne({
      _id: req.params.id,
      userId: req.user!.id,
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Site not found.' });
      return;
    }
    res.json({ success: true, data: site });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const site = await DeliverySite.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!site) {
      res.status(404).json({ success: false, message: 'Site not found.' });
      return;
    }
    res.json({ success: true, message: 'Delivery site updated.', data: site });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const site = await DeliverySite.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      { isActive: false },
      { new: true }
    );

    if (!site) {
      res.status(404).json({ success: false, message: 'Site not found.' });
      return;
    }
    res.json({ success: true, message: 'Delivery site removed.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
