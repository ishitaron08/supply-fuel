export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  DELIVERY_PARTNER = 'delivery_partner',
}

export enum ProfileType {
  ORGANIZATION = 'organization',
  INDIVIDUAL = 'individual',
}

export enum FuelType {
  DIESEL = 'diesel',
}

export enum OrderStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ASSIGNED = 'assigned',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentMode {
  CREDIT = 'credit',
  COD = 'cod',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

export enum NotificationType {
  ORDER_PLACED = 'order_placed',
  ORDER_APPROVED = 'order_approved',
  ORDER_REJECTED = 'order_rejected',
  ORDER_ASSIGNED = 'order_assigned',
  ORDER_OUT_FOR_DELIVERY = 'order_out_for_delivery',
  ORDER_DELIVERED = 'order_delivered',
  INVOICE_GENERATED = 'invoice_generated',
  PAYMENT_RECEIVED = 'payment_received',
}

export enum VehicleType {
  TANKER = 'tanker',
  MINI_TANKER = 'mini_tanker',
}
