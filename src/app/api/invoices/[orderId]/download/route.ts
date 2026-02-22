import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate } from '@/lib/server/auth';
import { Invoice } from '@/lib/server/models';

export const GET = withErrorHandler(
  async (req: NextRequest, { params }: { params: { orderId: string } }) => {
    await authenticate(req);

    const invoice = await Invoice.findOne({ orderId: params.orderId });
    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'Invoice not found.' },
        { status: 404 }
      );
    }

    // Redirect to the Cloudinary-hosted PDF URL
    if (!invoice.pdfUrl) {
      return NextResponse.json(
        { success: false, message: 'Invoice PDF not available.' },
        { status: 404 }
      );
    }

    return NextResponse.redirect(invoice.pdfUrl);
  }
);
