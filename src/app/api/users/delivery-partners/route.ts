import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate, authorize } from '@/lib/server/auth';
import { User } from '@/lib/server/models';
import { UserRole } from '@/lib/shared';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await authenticate(req);
  authorize(user, UserRole.ADMIN);

  const partners = await User.find({ role: 'delivery_partner' }).sort({
    createdAt: -1,
  });
  return NextResponse.json({ success: true, data: partners });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await authenticate(req);
  authorize(user, UserRole.ADMIN);

  const body = await req.json();
  const { name, email, phone, password } = body;

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json(
      { success: false, message: 'Email already registered.' },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const partner = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role: 'delivery_partner',
    isVerified: true,
  });

  return NextResponse.json(
    {
      success: true,
      message: 'Delivery partner created.',
      data: {
        id: partner._id,
        name: partner.name,
        email: partner.email,
      },
    },
    { status: 201 }
  );
});
