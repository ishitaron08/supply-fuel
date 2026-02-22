import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate, authorize } from '@/lib/server/auth';
import { Order } from '@/lib/server/models';
import { UserRole, OrderStatus } from '@/lib/shared';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await authenticate(req);
  authorize(user, UserRole.ADMIN);

  const [totalOrders, pendingOrders, deliveredOrders, approvedOrders, rejectedOrders, assignedOrders, outForDeliveryOrders, revenueResult] =
    await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: OrderStatus.PENDING }),
      Order.countDocuments({ status: OrderStatus.DELIVERED }),
      Order.countDocuments({ status: OrderStatus.APPROVED }),
      Order.countDocuments({ status: OrderStatus.REJECTED }),
      Order.countDocuments({ status: OrderStatus.ASSIGNED }),
      Order.countDocuments({ status: OrderStatus.OUT_FOR_DELIVERY }),
      Order.aggregate([
        { $match: { status: OrderStatus.DELIVERED } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalQuantity: { $sum: '$quantityLiters' },
          },
        },
      ]),
    ]);

  const activeDeliveries = assignedOrders + outForDeliveryOrders;

  const revenue = revenueResult[0] || { totalRevenue: 0, totalQuantity: 0 };

  return NextResponse.json({
    success: true,
    data: {
      totalOrders,
      pendingOrders,
      approvedOrders,
      rejectedOrders,
      assignedOrders,
      outForDeliveryOrders,
      deliveredOrders,
      activeDeliveries,
      totalRevenue: revenue.totalRevenue,
      totalQuantity: revenue.totalQuantity,
    },
  });
});
