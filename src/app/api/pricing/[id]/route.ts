import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate, authorize } from '@/lib/server/auth';
import { validateRequest } from '@/lib/server/validate';
import { updatePriceSchema } from '@/lib/server/validators';
import { FuelPrice } from '@/lib/server/models';
import { UserRole } from '@/lib/shared';

export const PUT = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await authenticate(req);
    authorize(user, UserRole.ADMIN);

    const body = await req.json();
    validateRequest(updatePriceSchema, { body, params });

    const { basePricePerLiter, gstPercentage } = body;

    const updates: any = {
      basePricePerLiter,
      isAdminOverride: true,
      lastUpdatedAt: new Date(),
      source: 'admin_override',
    };
    if (gstPercentage !== undefined) updates.gstPercentage = gstPercentage;

    const price = await FuelPrice.findByIdAndUpdate(params.id, updates, {
      new: true,
    });
    if (!price) {
      return NextResponse.json(
        { success: false, message: 'Price record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Price updated.',
      data: price,
    });
  }
);

export const DELETE = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await authenticate(req);
    authorize(user, UserRole.ADMIN);

    const price = await FuelPrice.findByIdAndDelete(params.id);
    if (!price) {
      return NextResponse.json(
        { success: false, message: 'Price record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Price for ${price.city} (${price.fuelType}) deleted.`,
    });
  }
);
