import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate } from '@/lib/server/auth';
import { User } from '@/lib/server/models';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const authUser = await authenticate(req);

  const user = await User.findById(authUser.id);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'User not found.' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: user });
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  const authUser = await authenticate(req);
  const body = await req.json();

  const allowedFields = [
    'name',
    'phone',
    'organizationName',
    'gstNumber',
    'profileType',
    'address',
    'city',
    'state',
  ];

  const updates: any = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  const user = await User.findByIdAndUpdate(authUser.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return NextResponse.json(
      { success: false, message: 'User not found.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Profile updated.',
    data: user,
  });
});
