import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withErrorHandler } from '@/lib/server/errors';
import { validateRequest } from '@/lib/server/validate';
import { registerSchema } from '@/lib/server/validators';
import { User } from '@/lib/server/models';
import { generateOTP } from '@/lib/server/utils/helpers';
import { sendOTPEmail } from '@/lib/server/services/emailService';
import { OTP_EXPIRY_MINUTES } from '@/lib/shared';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  validateRequest(registerSchema, { body });

  const { name, email, phone, password, profileType, organizationName } = body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json(
      { success: false, message: 'Email already registered.' },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const user = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    profileType,
    organizationName,
    otp,
    otpExpiry,
  });

  await sendOTPEmail(email, name, otp);

  return NextResponse.json(
    {
      success: true,
      message:
        'Registration successful. Please verify your email with the OTP sent.',
      data: { userId: user._id, email: user.email },
    },
    { status: 201 }
  );
});
