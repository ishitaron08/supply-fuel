import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate } from '@/lib/server/auth';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await authenticate(req);
  return NextResponse.json(
    {
      success: false,
      message:
        'Payment verification is disabled. This platform currently supports Cash on Delivery only.',
    },
    { status: 410 }
  );
});
