import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate, authorize } from '@/lib/server/auth';
import { validateRequest } from '@/lib/server/validate';
import { assignOrderSchema } from '@/lib/server/validators';
import { Order, User, Vehicle } from '@/lib/server/models';
import { UserRole, OrderStatus } from '@/lib/shared';
import { sendOrderStatusEmail } from '@/lib/server/services/emailService';
import { notifyOrderAssigned } from '@/lib/server/services/notificationService';

export const PUT = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await authenticate(req);
    authorize(user, UserRole.ADMIN);

    const body = await req.json();
    validateRequest(assignOrderSchema, { body, params });

    const { partnerId, vehicleId } = body;
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

    if (order.status !== OrderStatus.APPROVED) {
      return NextResponse.json(
        {
          success: false,
          message: `Can only assign approved orders. Current status: '${order.status}'.`,
        },
        { status: 400 }
      );
    }

    // Validate partner
    const partner = await User.findOne({
      _id: partnerId,
      role: UserRole.DELIVERY_PARTNER,
    });
    if (!partner) {
      return NextResponse.json(
        { success: false, message: 'Delivery partner not found.' },
        { status: 404 }
      );
    }

    // Validate vehicle
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      isAvailable: true,
    });
    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'Vehicle not found or not available.' },
        { status: 404 }
      );
    }

    if (vehicle.capacity < order.quantityLiters) {
      return NextResponse.json(
        {
          success: false,
          message: `Vehicle capacity (${vehicle.capacity}L) is less than order quantity (${order.quantityLiters}L).`,
        },
        { status: 400 }
      );
    }

    order.status = OrderStatus.ASSIGNED;
    order.assignedPartnerId = partner._id as any;
    order.assignedVehicleId = vehicle._id as any;
    await order.save();

    // Mark vehicle as unavailable
    vehicle.isAvailable = false;
    await vehicle.save();

    const customer = order.customerId as any;
    await notifyOrderAssigned(
      partnerId,
      customer._id.toString(),
      order.orderNumber,
      order._id.toString()
    );
    await sendOrderStatusEmail(
      customer.email,
      customer.name,
      order.orderNumber,
      'Assigned',
      `A delivery partner has been assigned. Your fuel will be delivered on ${order.requestedDeliveryDate.toLocaleDateString('en-IN')}.`
    );

    return NextResponse.json({
      success: true,
      message: 'Order assigned to delivery partner.',
      data: order,
    });
  }
);
