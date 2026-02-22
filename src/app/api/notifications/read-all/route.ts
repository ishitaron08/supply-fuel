import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate } from '@/lib/server/auth';
import { Notification } from '@/lib/server/models';

export const PUT = withErrorHandler(async (req: NextRequest) => {
  const user = await authenticate(req);

  await Notification.updateMany(
    { userId: user.id, isRead: false },
    { isRead: true }
  );

  return NextResponse.json({
    success: true,
    message: 'All notifications marked as read.',
  });
});
