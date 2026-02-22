import { Response } from 'express';
import { FuelPrice } from '../models';
import { AuthRequest } from '../middleware/auth';
import { DEFAULT_DIESEL_PRICE, STATE_GST_RATES } from 'shared';

export const getPriceForCity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { city, fuelType = 'diesel', quantity } = req.query;

    if (!city) {
      res.status(400).json({ success: false, message: 'City is required.' });
      return;
    }

    let fuelPrice = await FuelPrice.findOne({
      city: { $regex: new RegExp(`^${city}$`, 'i') },
      fuelType: fuelType as string,
    });

    const pricePerLiter = fuelPrice?.basePricePerLiter || DEFAULT_DIESEL_PRICE;
    const gstPercentage = fuelPrice?.gstPercentage || STATE_GST_RATES['default'];
    const qty = parseInt(quantity as string) || 1000;

    const baseAmount = pricePerLiter * qty;
    const gstAmount = (baseAmount * gstPercentage) / 100;
    const totalAmount = baseAmount + gstAmount;

    res.json({
      success: true,
      data: {
        city,
        fuelType: fuelType || 'diesel',
        pricePerLiter,
        gstPercentage,
        quantity: qty,
        baseAmount,
        gstAmount,
        totalAmount,
        source: fuelPrice?.source || 'default',
        lastUpdated: fuelPrice?.lastUpdatedAt || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllPrices = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prices = await FuelPrice.find().sort({ city: 1 });
    res.json({ success: true, data: prices });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePrice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { basePricePerLiter, gstPercentage } = req.body;

    const updates: any = {
      basePricePerLiter,
      isAdminOverride: true,
      lastUpdatedAt: new Date(),
      source: 'admin_override',
    };
    if (gstPercentage !== undefined) updates.gstPercentage = gstPercentage;

    const price = await FuelPrice.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!price) {
      res.status(404).json({ success: false, message: 'Price record not found.' });
      return;
    }

    res.json({ success: true, message: 'Price updated.', data: price });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPrice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { city, state, fuelType, basePricePerLiter, gstPercentage } = req.body;

    const existing = await FuelPrice.findOne({ city: { $regex: new RegExp(`^${city}$`, 'i') }, fuelType });
    if (existing) {
      res.status(409).json({ success: false, message: 'Price for this city already exists. Use update instead.' });
      return;
    }

    const price = await FuelPrice.create({
      city,
      state,
      fuelType: fuelType || 'diesel',
      basePricePerLiter,
      gstPercentage: gstPercentage || STATE_GST_RATES[state] || STATE_GST_RATES['default'],
      isAdminOverride: true,
      source: 'admin',
      lastUpdatedAt: new Date(),
    });

    res.status(201).json({ success: true, message: 'Price created.', data: price });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
