import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { FuelPrice } from '@/lib/server/models';

// GET /api/fuel-prices/:city — get price by city name
export const GET = withErrorHandler(
  async (req: NextRequest, { params }: { params: { city: string } }) => {
    const price = await FuelPrice.findOne({
      city: new RegExp(`^${params.city}$`, 'i'),
    });

    if (!price) {
      return NextResponse.json(
        {
          success: false,
          message: `No fuel price found for city: ${params.city}`,
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Fuel price for ${price.city}`,
      data: price,
    });
  }
);

// PUT /api/fuel-prices/:city — update price for city
export const PUT = withErrorHandler(
  async (req: NextRequest, { params }: { params: { city: string } }) => {
    const body = await req.json();

    const updateData: Record<string, unknown> = { lastUpdated: Date.now() };
    if (body.petrol !== undefined) updateData.petrol = body.petrol;
    if (body.diesel !== undefined) updateData.diesel = body.diesel;
    if (body.basePricePerLiter !== undefined)
      updateData.basePricePerLiter = body.basePricePerLiter;
    if (body.gstPercentage !== undefined)
      updateData.gstPercentage = body.gstPercentage;

    const price = await FuelPrice.findOneAndUpdate(
      { city: new RegExp(`^${params.city}$`, 'i') },
      updateData,
      { new: true, runValidators: true }
    );

    if (!price) {
      return NextResponse.json(
        {
          success: false,
          message: `No fuel price found for city: ${params.city}`,
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Fuel price for ${price.city} updated successfully`,
      data: price,
    });
  }
);

// DELETE /api/fuel-prices/:city
export const DELETE = withErrorHandler(
  async (req: NextRequest, { params }: { params: { city: string } }) => {
    const price = await FuelPrice.findOneAndDelete({
      city: new RegExp(`^${params.city}$`, 'i'),
    });

    if (!price) {
      return NextResponse.json(
        {
          success: false,
          message: `No fuel price found for city: ${params.city}`,
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Fuel price for ${price.city} deleted successfully`,
      data: null,
    });
  }
);
