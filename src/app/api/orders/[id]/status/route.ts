import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate, authorize } from '@/lib/server/auth';
import { Order, User, Vehicle } from '@/lib/server/models';
import {
  UserRole,
  OrderStatus,
  PaymentMode,
  PaymentStatus,
} from '@/lib/shared';
import { sendOrderStatusEmail } from '@/lib/server/services/emailService';
import { notifyOrderDelivered } from '@/lib/server/services/notificationService';
import { generateInvoice } from '@/lib/server/services/invoiceService';

export const PUT = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await authenticate(req);
    authorize(user, UserRole.DELIVERY_PARTNER, UserRole.ADMIN);

    const body = await req.json();
    const { status } = body;

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

    // Verify assigned partner
    if (user.role === UserRole.DELIVERY_PARTNER) {
      if (
        !order.assignedPartnerId ||
        order.assignedPartnerId.toString() !== user.id
      ) {
        return NextResponse.json(
          { success: false, message: 'Not assigned to this order.' },
          { status: 403 }
        );
      }
    }

    // Validate transitions
    const validTransitions: Record<string, string[]> = {
      [OrderStatus.ASSIGNED]: [OrderStatus.OUT_FOR_DELIVERY],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot transition from '${order.status}' to '${status}'.`,
        },
        { status: 400 }
      );
    }

    order.status = status;

    if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();

      // Release vehicle
      if (order.assignedVehicleId) {
        await Vehicle.findByIdAndUpdate(order.assignedVehicleId, {
          isAvailable: true,
        });
      }

      // Mark COD as paid on delivery
      if (order.paymentMode === PaymentMode.COD) {
        order.paymentStatus = PaymentStatus.PAID;
      }
    }

    await order.save();

    const customer = order.customerId as any;
    const statusLabel =
      status === OrderStatus.OUT_FOR_DELIVERY
        ? 'Out for Delivery'
        : 'Delivered';
    await sendOrderStatusEmail(
      customer.email,
      customer.name,
      order.orderNumber,
      statusLabel,
      status === OrderStatus.DELIVERED
        ? 'Your fuel order has been delivered successfully. Invoice will be sent shortly.'
        : 'Your fuel order is out for delivery and will arrive soon.'
    );

    // On delivered: notify admins and generate invoice
    if (status === OrderStatus.DELIVERED) {
      const admins = await User.find({ role: UserRole.ADMIN });
      const adminIds = admins.map((a: any) => a._id.toString());
      await notifyOrderDelivered(
        customer._id.toString(),
        adminIds,
        order.orderNumber,
        order._id.toString()
      );

      // Generate invoice asynchronously
      generateInvoice(order._id.toString()).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to '${status}'.`,
      data: order,
    });
  }
);
