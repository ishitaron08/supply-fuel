import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withErrorHandler } from '@/lib/server/errors';
import { validateRequest } from '@/lib/server/validate';
import { resetPasswordSchema } from '@/lib/server/validators';
import { User } from '@/lib/server/models';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  validateRequest(resetPasswordSchema, { body });

  const { email, otp, newPassword } = body;
  const user = await User.findOne({ email }).select('+otp +otpExpiry');

  if (!user || !user.otp || !user.otpExpiry) {
    return NextResponse.json(
      { success: false, message: 'Invalid request.' },
      { status: 400 }
    );
  }

  if (user.otpExpiry < new Date()) {
    return NextResponse.json(
      { success: false, message: 'OTP has expired.' },
      { status: 400 }
    );
  }

  if (user.otp !== otp) {
    return NextResponse.json(
      { success: false, message: 'Invalid OTP.' },
      { status: 400 }
    );
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  return NextResponse.json({
    success: true,
    message: 'Password has been reset successfully.',
  });
});
