import { Notification } from '../models';
import { NotificationType } from '@/lib/shared';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  orderId?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const notification = await Notification.create({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      orderId: params.orderId,
    });
    return notification;
  } catch (error) {
    console.error('❌ Notification creation error:', error);
    return null;
  }
};

export const notifyOrderPlaced = async (
  adminUserIds: string[],
  orderNumber: string,
  customerName: string,
  orderId: string
) => {
  const promises = adminUserIds.map((adminId) =>
    createNotification({
      userId: adminId,
      title: 'New Order Received',
      message: `New order ${orderNumber} placed by ${customerName}`,
      type: NotificationType.ORDER_PLACED,
      orderId,
    })
  );
  await Promise.all(promises);
};

export const notifyOrderApproved = async (
  customerId: string,
  orderNumber: string,
  orderId: string
) => {
  await createNotification({
    userId: customerId,
    title: 'Order Approved',
    message: `Your order ${orderNumber} has been approved`,
    type: NotificationType.ORDER_APPROVED,
    orderId,
  });
};

export const notifyOrderRejected = async (
  customerId: string,
  orderNumber: string,
  reason: string,
  orderId: string
) => {
  await createNotification({
    userId: customerId,
    title: 'Order Rejected',
    message: `Your order ${orderNumber} was rejected: ${reason}`,
    type: NotificationType.ORDER_REJECTED,
    orderId,
  });
};

export const notifyOrderAssigned = async (
  partnerId: string,
  customerId: string,
  orderNumber: string,
  orderId: string
) => {
  await Promise.all([
    createNotification({
      userId: partnerId,
      title: 'New Delivery Assigned',
      message: `Order ${orderNumber} has been assigned to you for delivery`,
      type: NotificationType.ORDER_ASSIGNED,
      orderId,
    }),
    createNotification({
      userId: customerId,
      title: 'Delivery Partner Assigned',
      message: `A delivery partner has been assigned to your order ${orderNumber}`,
      type: NotificationType.ORDER_ASSIGNED,
      orderId,
    }),
  ]);
};

export const notifyOrderDelivered = async (
  customerId: string,
  adminUserIds: string[],
  orderNumber: string,
  orderId: string
) => {
  const promises = [
    createNotification({
      userId: customerId,
      title: 'Order Delivered',
      message: `Your order ${orderNumber} has been delivered successfully`,
      type: NotificationType.ORDER_DELIVERED,
      orderId,
    }),
    ...adminUserIds.map((adminId) =>
      createNotification({
        userId: adminId,
        title: 'Order Delivered',
        message: `Order ${orderNumber} has been delivered`,
        type: NotificationType.ORDER_DELIVERED,
        orderId,
      })
    ),
  ];
  await Promise.all(promises);
};
