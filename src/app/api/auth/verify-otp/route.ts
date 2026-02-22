import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { validateRequest } from '@/lib/server/validate';
import { verifyOtpSchema } from '@/lib/server/validators';
import { User } from '@/lib/server/models';
import {
  generateAccessToken,
  generateRefreshToken,
} from '@/lib/server/utils/helpers';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  validateRequest(verifyOtpSchema, { body });

  const { email, otp } = body;

  const user = await User.findOne({ email }).select('+otp +otpExpiry');
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'User not found.' },
      { status: 404 }
    );
  }

  if (user.isVerified) {
    return NextResponse.json(
      { success: false, message: 'Account already verified.' },
      { status: 400 }
    );
  }

  if (!user.otp || !user.otpExpiry) {
    return NextResponse.json(
      { success: false, message: 'No OTP found. Please request a new one.' },
      { status: 400 }
    );
  }

  if (user.otpExpiry < new Date()) {
    return NextResponse.json(
      {
        success: false,
        message: 'OTP has expired. Please request a new one.',
      },
      { status: 400 }
    );
  }

  if (user.otp !== otp) {
    return NextResponse.json(
      { success: false, message: 'Invalid OTP.' },
      { status: 400 }
    );
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  const accessToken = generateAccessToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  });
  const refreshToken = generateRefreshToken({ id: user._id.toString() });

  return NextResponse.json({
    success: true,
    message: 'Account verified successfully.',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileType: user.profileType,
        organizationName: user.organizationName,
      },
      accessToken,
      refreshToken,
    },
  });
});
