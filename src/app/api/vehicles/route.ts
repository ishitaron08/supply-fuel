import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate, authorize } from '@/lib/server/auth';
import { validateRequest } from '@/lib/server/validate';
import { createVehicleSchema } from '@/lib/server/validators';
import { Vehicle } from '@/lib/server/models';
import { UserRole } from '@/lib/shared';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await authenticate(req);
  authorize(user, UserRole.ADMIN);

  const body = await req.json();
  validateRequest(createVehicleSchema, { body });

  const vehicle = await Vehicle.create(body);
  return NextResponse.json(
    { success: true, message: 'Vehicle created.', data: vehicle },
    { status: 201 }
  );
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await authenticate(req);
  authorize(user, UserRole.ADMIN);

  const { searchParams } = new URL(req.url);
  const driverId = searchParams.get('driverId');

  const filter: any = {};
  if (driverId) filter.driverId = driverId;

  const vehicles = await Vehicle.find(filter)
    .populate('driverId', 'name phone')
    .sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: vehicles });
});
