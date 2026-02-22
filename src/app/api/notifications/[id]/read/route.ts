import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate } from '@/lib/server/auth';
import { Notification } from '@/lib/server/models';

export const PUT = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await authenticate(req);

    const notification = await Notification.findOneAndUpdate(
      { _id: params.id, userId: user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: notification });
  }
);
