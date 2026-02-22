import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate, authorize } from '@/lib/server/auth';
import { validateRequest } from '@/lib/server/validate';
import { rejectOrderSchema } from '@/lib/server/validators';
import { Order } from '@/lib/server/models';
import { UserRole, OrderStatus } from '@/lib/shared';
import { sendOrderStatusEmail } from '@/lib/server/services/emailService';
import { notifyOrderRejected } from '@/lib/server/services/notificationService';

export const PUT = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await authenticate(req);
    authorize(user, UserRole.ADMIN);

    const body = await req.json();
    validateRequest(rejectOrderSchema, { body, params });

    const { reason } = body;
    const order = await Order.findById(params.id).populate(
      'customerId',
      'name email'
    );
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found.' },
        { status: 404 }
      );
    }

    if (order.status !== OrderStatus.PENDING) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot reject order with status '${order.status}'.`,
        },
        { status: 400 }
      );
    }

    order.status = OrderStatus.REJECTED;
    order.rejectionReason = reason;
    await order.save();

    const customer = order.customerId as any;
    await notifyOrderRejected(
      customer._id.toString(),
      order.orderNumber,
      reason,
      order._id.toString()
    );
    await sendOrderStatusEmail(
      customer.email,
      customer.name,
      order.orderNumber,
      'Rejected',
      `Your fuel order has been rejected. Reason: ${reason}`
    );

    return NextResponse.json({
      success: true,
      message: 'Order rejected.',
      data: order,
    });
  }
);
