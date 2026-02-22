import { Response } from 'express';
import { Vehicle } from '../models';
import { AuthRequest } from '../middleware/auth';

export const createVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({ success: true, message: 'Vehicle created.', data: vehicle });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVehicles = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicles = await Vehicle.find().populate('driverId', 'name phone').sort({ createdAt: -1 });
    res.json({ success: true, data: vehicles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVehicleById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('driverId', 'name phone');
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found.' });
      return;
    }
    res.json({ success: true, data: vehicle });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found.' });
      return;
    }
    res.json({ success: true, message: 'Vehicle updated.', data: vehicle });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found.' });
      return;
    }
    res.json({ success: true, message: 'Vehicle deleted.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
