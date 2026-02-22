import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate } from '@/lib/server/auth';
import { validateRequest } from '@/lib/server/validate';
import { createSiteSchema } from '@/lib/server/validators';
import { DeliverySite } from '@/lib/server/models';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await authenticate(req);

  const body = await req.json();
  validateRequest(createSiteSchema, { body });

  const site = await DeliverySite.create({
    ...body,
    userId: user.id,
  });

  return NextResponse.json(
    { success: true, message: 'Delivery site created.', data: site },
    { status: 201 }
  );
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await authenticate(req);

  const sites = await DeliverySite.find({
    userId: user.id,
    isActive: true,
  }).sort({ createdAt: -1 });

  return NextResponse.json({ success: true, data: sites });
});
