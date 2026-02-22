import { Response } from 'express';
import { Order, User, DeliverySite, FuelPrice, Vehicle } from '../models';
import { AuthRequest } from '../middleware/auth';
import { UserRole, OrderStatus, PaymentMode, PaymentStatus, NotificationType } from 'shared';
import { generateOrderNumber } from '../utils/helpers';
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from '../services/emailService';
import {
  notifyOrderPlaced,
  notifyOrderApproved,
  notifyOrderRejected,
  notifyOrderAssigned,
  notifyOrderDelivered,
} from '../services/notificationService';
import { generateInvoice } from '../services/invoiceService';
import { DEFAULT_DIESEL_PRICE, STATE_GST_RATES } from 'shared';

// Customer: Create order
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deliverySiteId, fuelType, quantityLiters, requestedDeliveryDate, notes } = req.body;

    // Validate delivery site belongs to user
    const site = await DeliverySite.findOne({ _id: deliverySiteId, userId: req.user!.id, isActive: true });
    if (!site) {
      res.status(404).json({ success: false, message: 'Delivery site not found.' });
      return;
    }

    // Get fuel price for city
    let fuelPrice = await FuelPrice.findOne({ city: { $regex: new RegExp(`^${site.city}$`, 'i') }, fuelType });
    let pricePerLiter = fuelPrice?.basePricePerLiter || DEFAULT_DIESEL_PRICE;
    let gstPercentage = fuelPrice?.gstPercentage || STATE_GST_RATES[site.state] || STATE_GST_RATES['default'];

    const baseAmount = pricePerLiter * quantityLiters;
    const gstAmount = (baseAmount * gstPercentage) / 100;
    const totalAmount = baseAmount + gstAmount;

    const orderNumber = await generateOrderNumber(Order);

    const order = await Order.create({
      orderNumber,
      customerId: req.user!.id,
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
    await sendOrderConfirmationEmail(req.user!.email, req.user!.name, orderNumber, {
      quantity: quantityLiters,
      total: totalAmount,
      deliveryDate: new Date(requestedDeliveryDate).toLocaleDateString('en-IN'),
      site: `${site.siteName}, ${site.city}`,
    });

    // Notify all admins
    const admins = await User.find({ role: UserRole.ADMIN });
    const adminIds = admins.map((a) => a._id.toString());
    await notifyOrderPlaced(adminIds, orderNumber, req.user!.name, order._id.toString());

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: order,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// List orders (role-filtered)
export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const filter: any = {};

    // Role-based filtering
    if (req.user!.role === UserRole.CUSTOMER) {
      filter.customerId = req.user!.id;
    } else if (req.user!.role === UserRole.DELIVERY_PARTNER) {
      filter.assignedPartnerId = req.user!.id;
    }
    // Admin sees all — no filter needed

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

    res.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get order by ID
export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phone organizationName gstNumber address city state')
      .populate('deliverySiteId')
      .populate('assignedPartnerId', 'name phone email')
      .populate('assignedVehicleId');

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // Verify access
    const isOwner = order.customerId && (order.customerId as any)._id.toString() === req.user!.id;
    const isAssigned = order.assignedPartnerId && (order.assignedPartnerId as any)._id.toString() === req.user!.id;
    const isAdmin = req.user!.role === UserRole.ADMIN;

    if (!isOwner && !isAssigned && !isAdmin) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Approve order
export const approveOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).populate('customerId', 'name email');
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (order.status !== OrderStatus.PENDING) {
      res.status(400).json({ success: false, message: `Cannot approve order with status '${order.status}'.` });
      return;
    }

    order.status = OrderStatus.APPROVED;
    await order.save();

    const customer = order.customerId as any;
    await notifyOrderApproved(customer._id.toString(), order.orderNumber, order._id.toString());
    await sendOrderStatusEmail(
      customer.email,
      customer.name,
      order.orderNumber,
      'Approved',
      'Your fuel order has been approved and will be assigned to a delivery partner shortly.'
    );

    res.json({ success: true, message: 'Order approved.', data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Reject order
export const rejectOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id).populate('customerId', 'name email');
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (order.status !== OrderStatus.PENDING) {
      res.status(400).json({ success: false, message: `Cannot reject order with status '${order.status}'.` });
      return;
    }

    order.status = OrderStatus.REJECTED;
    order.rejectionReason = reason;
    await order.save();

    const customer = order.customerId as any;
    await notifyOrderRejected(customer._id.toString(), order.orderNumber, reason, order._id.toString());
    await sendOrderStatusEmail(
      customer.email,
      customer.name,
      order.orderNumber,
      'Rejected',
      `Your fuel order has been rejected. Reason: ${reason}`
    );

    res.json({ success: true, message: 'Order rejected.', data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Assign delivery partner + vehicle
export const assignOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { partnerId, vehicleId } = req.body;
    const order = await Order.findById(req.params.id).populate('customerId', 'name email');
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (order.status !== OrderStatus.APPROVED) {
      res.status(400).json({ success: false, message: `Can only assign approved orders. Current status: '${order.status}'.` });
      return;
    }

    // Validate partner
    const partner = await User.findOne({ _id: partnerId, role: UserRole.DELIVERY_PARTNER });
    if (!partner) {
      res.status(404).json({ success: false, message: 'Delivery partner not found.' });
      return;
    }

    // Validate vehicle
    const vehicle = await Vehicle.findOne({ _id: vehicleId, isAvailable: true });
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found or not available.' });
      return;
    }

    if (vehicle.capacity < order.quantityLiters) {
      res.status(400).json({
        success: false,
        message: `Vehicle capacity (${vehicle.capacity}L) is less than order quantity (${order.quantityLiters}L).`,
      });
      return;
    }

    order.status = OrderStatus.ASSIGNED;
    order.assignedPartnerId = partner._id as any;
    order.assignedVehicleId = vehicle._id as any;
    await order.save();

    // Mark vehicle as unavailable during delivery
    vehicle.isAvailable = false;
    await vehicle.save();

    const customer = order.customerId as any;
    await notifyOrderAssigned(partnerId, customer._id.toString(), order.orderNumber, order._id.toString());
    await sendOrderStatusEmail(
      customer.email,
      customer.name,
      order.orderNumber,
      'Assigned',
      `A delivery partner has been assigned. Your fuel will be delivered on ${order.requestedDeliveryDate.toLocaleDateString('en-IN')}.`
    );

    res.json({ success: true, message: 'Order assigned to delivery partner.', data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delivery Partner: Update status
export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email');

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // Verify assigned partner
    if (req.user!.role === UserRole.DELIVERY_PARTNER) {
      if (!order.assignedPartnerId || order.assignedPartnerId.toString() !== req.user!.id) {
        res.status(403).json({ success: false, message: 'Not assigned to this order.' });
        return;
      }
    }

    // Validate transitions
    const validTransitions: Record<string, string[]> = {
      [OrderStatus.ASSIGNED]: [OrderStatus.OUT_FOR_DELIVERY],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Cannot transition from '${order.status}' to '${status}'.`,
      });
      return;
    }

    order.status = status;

    if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();

      // Release vehicle
      if (order.assignedVehicleId) {
        await Vehicle.findByIdAndUpdate(order.assignedVehicleId, { isAvailable: true });
      }

      // Mark COD as paid on delivery
      if (order.paymentMode === PaymentMode.COD) {
        order.paymentStatus = PaymentStatus.PAID;
      }
    }

    await order.save();

    const customer = order.customerId as any;
    const statusLabel = status === OrderStatus.OUT_FOR_DELIVERY ? 'Out for Delivery' : 'Delivered';
    await sendOrderStatusEmail(customer.email, customer.name, order.orderNumber, statusLabel,
      status === OrderStatus.DELIVERED
        ? 'Your fuel order has been delivered successfully. Invoice will be sent shortly.'
        : 'Your fuel order is out for delivery and will arrive soon.'
    );

    // On delivered: notify admins and generate invoice
    if (status === OrderStatus.DELIVERED) {
      const admins = await User.find({ role: UserRole.ADMIN });
      const adminIds = admins.map((a) => a._id.toString());
      await notifyOrderDelivered(customer._id.toString(), adminIds, order.orderNumber, order._id.toString());

      // Generate invoice asynchronously
      generateInvoice(order._id.toString()).catch(console.error);
    }

    res.json({ success: true, message: `Order status updated to '${status}'.`, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Dashboard stats
export const getOrderStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalOrders, pendingOrders, deliveredOrders, revenueResult] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: OrderStatus.PENDING }),
      Order.countDocuments({ status: OrderStatus.DELIVERED }),
      Order.aggregate([
        { $match: { status: OrderStatus.DELIVERED } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalQuantity: { $sum: '$quantityLiters' } } },
      ]),
    ]);

    const activeDeliveries = await Order.countDocuments({
      status: { $in: [OrderStatus.ASSIGNED, OrderStatus.OUT_FOR_DELIVERY] },
    });

    const revenue = revenueResult[0] || { totalRevenue: 0, totalQuantity: 0 };

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        activeDeliveries,
        totalRevenue: revenue.totalRevenue,
        totalQuantity: revenue.totalQuantity,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
