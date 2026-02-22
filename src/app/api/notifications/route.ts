import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate } from '@/lib/server/auth';
import { Notification } from '@/lib/server/models';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await authenticate(req);

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments({ userId: user.id }),
    Notification.countDocuments({ userId: user.id, isRead: false }),
  ]);

  return NextResponse.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});
