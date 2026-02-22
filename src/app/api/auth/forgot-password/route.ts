import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { validateRequest } from '@/lib/server/validate';
import { forgotPasswordSchema } from '@/lib/server/validators';
import { User } from '@/lib/server/models';
import { generateOTP } from '@/lib/server/utils/helpers';
import { sendOTPEmail } from '@/lib/server/services/emailService';
import { OTP_EXPIRY_MINUTES } from '@/lib/shared';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  validateRequest(forgotPasswordSchema, { body });

  const { email } = body;
  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'No account found with this email.' },
      { status: 404 }
    );
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save();

  await sendOTPEmail(email, user.name, otp);

  return NextResponse.json({
    success: true,
    message: 'Password reset OTP has been sent to your email.',
  });
});
