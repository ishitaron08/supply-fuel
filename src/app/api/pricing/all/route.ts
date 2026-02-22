import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate, authorize } from '@/lib/server/auth';
import { FuelPrice } from '@/lib/server/models';
import { UserRole } from '@/lib/shared';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await authenticate(req);
  authorize(user, UserRole.ADMIN);

  const { searchParams } = new URL(req.url);
  const state    = searchParams.get('state');
  const fuelType = searchParams.get('fuelType');
  const city     = searchParams.get('city');
  const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit    = Math.min(200, parseInt(searchParams.get('limit') || '200'));

  const filter: any = {};
  if (state)    filter.state    = { $regex: new RegExp(`^${state}$`, 'i') };
  if (fuelType) filter.fuelType = fuelType;
  if (city)     filter.city     = { $regex: city, $options: 'i' };

  const [prices, total] = await Promise.all([
    FuelPrice.find(filter)
      .sort({ state: 1, city: 1, fuelType: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    FuelPrice.countDocuments(filter),
  ]);

  return NextResponse.json({
    success: true,
    data: prices,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});
