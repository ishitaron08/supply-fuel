import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { User } from './models';
import config from './config';
import { UserRole } from '@/lib/shared';
import { ApiError } from './errors';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export async function authenticate(req: NextRequest): Promise<AuthUser> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Access denied. No token provided.');
  }

  const token = authHeader.split(' ')[1];

  let decoded: any;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new ApiError(401, 'Invalid or expired token.');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'Invalid token. User not found.');
  }

  if (!user.isVerified) {
    throw new ApiError(403, 'Account not verified. Please verify your email.');
  }

  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  };
}

export function authorize(user: AuthUser, ...roles: UserRole[]): void {
  if (!roles.includes(user.role)) {
    throw new ApiError(403, 'You do not have permission to perform this action.');
  }
}
