import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate, authorize } from '@/lib/server/auth';
import { Invoice } from '@/lib/server/models';
import { UserRole } from '@/lib/shared';

export const GET = withErrorHandler(
  async (req: NextRequest, { params }: { params: { orderId: string } }) => {
    const user = await authenticate(req);

    const invoice = await Invoice.findOne({ orderId: params.orderId })
      .populate('orderId', 'orderNumber customerId')
      .populate('customerId', 'name email');

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'Invoice not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: invoice });
  }
);
