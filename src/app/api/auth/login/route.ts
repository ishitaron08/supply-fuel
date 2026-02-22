import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withErrorHandler } from '@/lib/server/errors';
import { validateRequest } from '@/lib/server/validate';
import { loginSchema } from '@/lib/server/validators';
import { User } from '@/lib/server/models';
import {
  generateAccessToken,
  generateRefreshToken,
  generateOTP,
} from '@/lib/server/utils/helpers';
import { sendOTPEmail } from '@/lib/server/services/emailService';
import { OTP_EXPIRY_MINUTES } from '@/lib/shared';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  validateRequest(loginSchema, { body });

  const { email, password } = body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Invalid email or password.' },
      { status: 401 }
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return NextResponse.json(
      { success: false, message: 'Invalid email or password.' },
      { status: 401 }
    );
  }

  if (!user.isVerified) {
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
    await sendOTPEmail(email, user.name, otp);

    return NextResponse.json(
      {
        success: false,
        message:
          'Account not verified. A new OTP has been sent to your email.',
        data: { requiresVerification: true, email },
      },
      { status: 403 }
    );
  }

  const accessToken = generateAccessToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  });
  const refreshToken = generateRefreshToken({ id: user._id.toString() });

  return NextResponse.json({
    success: true,
    message: 'Login successful.',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileType: user.profileType,
        organizationName: user.organizationName,
        address: user.address,
        city: user.city,
        state: user.state,
        gstNumber: user.gstNumber,
      },
      accessToken,
      refreshToken,
    },
  });
});
