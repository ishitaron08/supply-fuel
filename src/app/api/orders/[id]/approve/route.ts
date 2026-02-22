import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate, authorize } from '@/lib/server/auth';
import { Order } from '@/lib/server/models';
import { UserRole, OrderStatus } from '@/lib/shared';
import { sendOrderStatusEmail } from '@/lib/server/services/emailService';
import { notifyOrderApproved } from '@/lib/server/services/notificationService';

export const PUT = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await authenticate(req);
    authorize(user, UserRole.ADMIN);

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
          message: `Cannot approve order with status '${order.status}'.`,
        },
        { status: 400 }
      );
    }

    order.status = OrderStatus.APPROVED;
    await order.save();

    const customer = order.customerId as any;
    await notifyOrderApproved(
      customer._id.toString(),
      order.orderNumber,
      order._id.toString()
    );
    await sendOrderStatusEmail(
      customer.email,
      customer.name,
      order.orderNumber,
      'Approved',
      'Your fuel order has been approved and will be assigned to a delivery partner shortly.'
    );

    return NextResponse.json({
      success: true,
      message: 'Order approved.',
      data: order,
    });
  }
);
