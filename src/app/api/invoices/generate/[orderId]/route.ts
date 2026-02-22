import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate, authorize } from '@/lib/server/auth';
import { generateInvoice } from '@/lib/server/services/invoiceService';
import { UserRole } from '@/lib/shared';

export const POST = withErrorHandler(
  async (req: NextRequest, { params }: { params: { orderId: string } }) => {
    const user = await authenticate(req);
    authorize(user, UserRole.ADMIN);

    const invoiceNumber = await generateInvoice(params.orderId);
    if (!invoiceNumber) {
      return NextResponse.json(
        { success: false, message: 'Invoice generation failed.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice generated.',
      data: { invoiceNumber },
    });
  }
);
