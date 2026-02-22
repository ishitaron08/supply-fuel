import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate } from '@/lib/server/auth';
import { DeliverySite } from '@/lib/server/models';

export const GET = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await authenticate(req);

    const site = await DeliverySite.findOne({
      _id: params.id,
      userId: user.id,
    });

    if (!site) {
      return NextResponse.json(
        { success: false, message: 'Site not found.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: site });
  }
);

export const PUT = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await authenticate(req);
    const body = await req.json();

    const site = await DeliverySite.findOneAndUpdate(
      { _id: params.id, userId: user.id },
      body,
      { new: true, runValidators: true }
    );

    if (!site) {
      return NextResponse.json(
        { success: false, message: 'Site not found.' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: 'Delivery site updated.',
      data: site,
    });
  }
);

export const DELETE = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await authenticate(req);

    const site = await DeliverySite.findOneAndUpdate(
      { _id: params.id, userId: user.id },
      { isActive: false },
      { new: true }
    );

    if (!site) {
      return NextResponse.json(
        { success: false, message: 'Site not found.' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: 'Delivery site removed.',
    });
  }
);
