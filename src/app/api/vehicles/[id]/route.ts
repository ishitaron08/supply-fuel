import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate, authorize } from '@/lib/server/auth';
import { Vehicle } from '@/lib/server/models';
import { UserRole } from '@/lib/shared';

export const GET = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await authenticate(req);
    authorize(user, UserRole.ADMIN);

    const vehicle = await Vehicle.findById(params.id).populate(
      'driverId',
      'name phone'
    );
    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'Vehicle not found.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: vehicle });
  }
);

export const PUT = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await authenticate(req);
    authorize(user, UserRole.ADMIN);

    const body = await req.json();
    const vehicle = await Vehicle.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'Vehicle not found.' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: 'Vehicle updated.',
      data: vehicle,
    });
  }
);

export const DELETE = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await authenticate(req);
    authorize(user, UserRole.ADMIN);

    const vehicle = await Vehicle.findByIdAndDelete(params.id);
    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'Vehicle not found.' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: 'Vehicle deleted.',
    });
  }
);
