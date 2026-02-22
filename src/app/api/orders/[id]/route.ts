import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate } from '@/lib/server/auth';
import { Order } from '@/lib/server/models';
import { UserRole } from '@/lib/shared';

export const GET = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await authenticate(req);

    const order = await Order.findById(params.id)
      .populate(
        'customerId',
        'name email phone organizationName gstNumber address city state'
      )
      .populate('deliverySiteId')
      .populate('assignedPartnerId', 'name phone email')
      .populate('assignedVehicleId');

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found.' },
        { status: 404 }
      );
    }

    // Verify access
    const isOwner =
      order.customerId &&
      (order.customerId as any)._id.toString() === user.id;
    const isAssigned =
      order.assignedPartnerId &&
      (order.assignedPartnerId as any)._id.toString() === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isOwner && !isAssigned && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  }
);
