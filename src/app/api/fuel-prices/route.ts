import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { FuelPrice } from '@/lib/server/models';

// GET /api/fuel-prices — list all prices
export const GET = withErrorHandler(async () => {
  const prices = await FuelPrice.find().sort({ city: 1 });
  return NextResponse.json({
    success: true,
    message: 'Fuel prices retrieved successfully',
    data: prices,
  });
});

// POST /api/fuel-prices — add new city price
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { city, state, basePricePerLiter, gstPercentage, fuelType, petrol, diesel } =
    await req.json();

  // Support both the main-server schema and the microservice schema
  if (city && (petrol !== undefined || diesel !== undefined)) {
    // fuel-price-service style (simple city/petrol/diesel)
    const exists = await FuelPrice.findOne({
      city: new RegExp(`^${city}$`, 'i'),
    });
    if (exists) {
      return NextResponse.json(
        { success: false, message: `Fuel price for ${city} already exists`, data: null },
        { status: 409 }
      );
    }

    const price = await FuelPrice.create({ city, petrol, diesel });
    return NextResponse.json(
      {
        success: true,
        message: `Fuel price for ${price.city} added successfully`,
        data: price,
      },
      { status: 201 }
    );
  }

  // main-server FuelPrice schema
  const existing = await FuelPrice.findOne({ city, fuelType });
  if (existing) {
    return NextResponse.json(
      { success: false, message: `Price for ${city} (${fuelType}) already exists.` },
      { status: 409 }
    );
  }

  const price = await FuelPrice.create({
    city,
    state,
    basePricePerLiter,
    gstPercentage,
    fuelType,
  });

  return NextResponse.json(
    { success: true, message: 'Fuel price created.', data: price },
    { status: 201 }
  );
});
