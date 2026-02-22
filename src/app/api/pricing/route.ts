import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate, authorize } from '@/lib/server/auth';
import { validateRequest } from '@/lib/server/validate';
import { FuelPrice } from '@/lib/server/models';
import { UserRole, DEFAULT_FUEL_PRICES, STATE_GST_RATES } from '@/lib/shared';
import { createPriceSchema } from '@/lib/server/validators';

export const GET = withErrorHandler(async (req: NextRequest) => {
  await authenticate(req);

  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');
  const fuelType = searchParams.get('fuelType') || 'diesel';
  const quantity = parseInt(searchParams.get('quantity') || '1000');

  if (!city) {
    return NextResponse.json(
      { success: false, message: 'City is required.' },
      { status: 400 }
    );
  }

  const fuelPrice = await FuelPrice.findOne({
    city: { $regex: new RegExp(`^${city}$`, 'i') },
    fuelType,
  });

  const pricePerLiter = fuelPrice?.basePricePerLiter || DEFAULT_FUEL_PRICES[fuelType] || DEFAULT_FUEL_PRICES['diesel'];
  const gstPercentage = fuelPrice?.gstPercentage || STATE_GST_RATES['default'];

  const baseAmount = pricePerLiter * quantity;
  const gstAmount = (baseAmount * gstPercentage) / 100;
  const totalAmount = baseAmount + gstAmount;

  return NextResponse.json({
    success: true,
    data: {
      city,
      fuelType,
      pricePerLiter,
      gstPercentage,
      quantity,
      baseAmount,
      gstAmount,
      totalAmount,
      source: fuelPrice?.source || 'default',
      lastUpdated: fuelPrice?.lastUpdatedAt || null,
    },
  });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await authenticate(req);
  authorize(user, UserRole.ADMIN);

  const body = await req.json();
  validateRequest(createPriceSchema, { body });

  const { city, state, fuelType, basePricePerLiter, gstPercentage } = body;

  const existing = await FuelPrice.findOne({
    city: { $regex: new RegExp(`^${city}$`, 'i') },
    fuelType,
  });
  if (existing) {
    return NextResponse.json(
      {
        success: false,
        message: 'Price for this city already exists. Use update instead.',
      },
      { status: 409 }
    );
  }

  const price = await FuelPrice.create({
    city,
    state,
    fuelType: fuelType || 'diesel',
    basePricePerLiter,
    gstPercentage:
      gstPercentage || STATE_GST_RATES[state] || STATE_GST_RATES['default'],
    isAdminOverride: true,
    source: 'admin',
    lastUpdatedAt: new Date(),
  });

  return NextResponse.json(
    { success: true, message: 'Price created.', data: price },
    { status: 201 }
  );
});
