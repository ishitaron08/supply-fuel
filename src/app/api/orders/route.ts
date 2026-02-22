import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate, authorize } from '@/lib/server/auth';
import { validateRequest } from '@/lib/server/validate';
import { createOrderSchema } from '@/lib/server/validators';
import {
  Order,
  User,
  DeliverySite,
  FuelPrice,
} from '@/lib/server/models';
import { generateOrderNumber } from '@/lib/server/utils/helpers';
import { sendOrderConfirmationEmail } from '@/lib/server/services/emailService';
import { notifyOrderPlaced } from '@/lib/server/services/notificationService';
import {
  UserRole,
  PaymentMode,
  PaymentStatus,
  DEFAULT_FUEL_PRICES,
  STATE_GST_RATES,
} from '@/lib/shared';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await authenticate(req);
  authorize(user, UserRole.CUSTOMER);

  const body = await req.json();
  validateRequest(createOrderSchema, { body });

  const { deliverySiteId, fuelType, quantityLiters, requestedDeliveryDate, notes } =
    body;

  // Validate delivery site belongs to user
  const site = await DeliverySite.findOne({
    _id: deliverySiteId,
    userId: user.id,
    isActive: true,
  });
  if (!site) {
    return NextResponse.json(
      { success: false, message: 'Delivery site not found.' },
      { status: 404 }
    );
  }

  // Get fuel price for city
  const fuelPrice = await FuelPrice.findOne({
    city: { $regex: new RegExp(`^${site.city}$`, 'i') },
    fuelType,
  });
  const pricePerLiter = fuelPrice?.basePricePerLiter || DEFAULT_FUEL_PRICES[fuelType] || DEFAULT_FUEL_PRICES['diesel'];
  const gstPercentage =
    fuelPrice?.gstPercentage ||
    STATE_GST_RATES[site.state] ||
    STATE_GST_RATES['default'];

  const baseAmount = pricePerLiter * quantityLiters;
  const gstAmount = (baseAmount * gstPercentage) / 100;
  const totalAmount = baseAmount + gstAmount;

  const orderNumber = await generateOrderNumber(Order);

  const order = await Order.create({
    orderNumber,
    customerId: user.id,
    deliverySiteId,
    fuelType,
    quantityLiters,
    pricePerLiter,
    gstPercentage,
    gstAmount,
    totalAmount,
    requestedDeliveryDate: new Date(requestedDeliveryDate),
    paymentMode: PaymentMode.COD,
    paymentStatus: PaymentStatus.PENDING,
    notes,
  });

  // Send confirmation email
  await sendOrderConfirmationEmail(user.email, user.name, orderNumber, {
    quantity: quantityLiters,
    total: totalAmount,
    deliveryDate: new Date(requestedDeliveryDate).toLocaleDateString('en-IN'),
    site: `${site.siteName}, ${site.city}`,
  });

  // Notify all admins
  const admins = await User.find({ role: UserRole.ADMIN });
  const adminIds = admins.map((a: any) => a._id.toString());
  await notifyOrderPlaced(adminIds, orderNumber, user.name, order._id.toString());

  return NextResponse.json(
    { success: true, message: 'Order placed successfully.', data: order },
    { status: 201 }
  );
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await authenticate(req);

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const filter: any = {};

  // Role-based filtering
  if (user.role === UserRole.CUSTOMER) {
    filter.customerId = user.id;
  } else if (user.role === UserRole.DELIVERY_PARTNER) {
    filter.assignedPartnerId = user.id;
  }

  if (status) filter.status = status;
  if (search) {
    filter.$or = [{ orderNumber: { $regex: search, $options: 'i' } }];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('customerId', 'name email phone organizationName')
      .populate('deliverySiteId', 'siteName city state address')
      .populate('assignedPartnerId', 'name phone')
      .populate('assignedVehicleId', 'vehicleNumber type capacity')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return NextResponse.json({
    success: true,
    data: orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
