import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { withErrorHandler, ApiError } from '@/lib/server/errors';
import { User } from '@/lib/server/models';
import { generateAccessToken } from '@/lib/server/utils/helpers';
import config from '@/lib/server/config';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { refreshToken: token } = body;

  if (!token) {
    throw new ApiError(400, 'Refresh token is required.');
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, config.jwtRefreshSecret);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token.');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'Invalid refresh token.');
  }

  const accessToken = generateAccessToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  });

  return NextResponse.json({
    success: true,
    data: { accessToken },
  });
});
