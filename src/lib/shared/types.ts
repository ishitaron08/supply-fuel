import {
  UserRole,
  ProfileType,
  FuelType,
  OrderStatus,
  PaymentMode,
  PaymentStatus,
  NotificationType,
  VehicleType,
} from './enums';

// ─── User ────────────────────────────────────────────
export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  isVerified: boolean;
  otp?: string;
  otpExpiry?: Date;
  organizationName?: string;
  gstNumber?: string;
  profileType?: ProfileType;
  address?: string;
  city?: string;
  state?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Delivery Site ───────────────────────────────────
export interface IDeliverySite {
  _id: string;
  userId: string;
  siteName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactPerson: string;
  contactPhone: string;
  geoLocation?: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Fuel Price ──────────────────────────────────────
export interface IFuelPrice {
  _id: string;
  city: string;
  state: string;
  fuelType: FuelType;
  basePricePerLiter: number;
  gstPercentage: number;
  effectiveDate: Date;
  source: string;
  isAdminOverride: boolean;
  lastUpdatedAt: Date;
}

// ─── Order ───────────────────────────────────────────
export interface IOrder {
  _id: string;
  orderNumber: string;
  customerId: string | IUser;
  deliverySiteId: string | IDeliverySite;
  fuelType: FuelType;
  quantityLiters: number;
  pricePerLiter: number;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;
  requestedDeliveryDate: Date;
  status: OrderStatus;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  assignedPartnerId?: string | IUser;
  assignedVehicleId?: string | IVehicle;
  rejectionReason?: string;
  deliveredAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Vehicle ─────────────────────────────────────────
export interface IVehicle {
  _id: string;
  vehicleNumber: string;
  type: VehicleType;
  capacity: number;
  driverId?: string | IUser;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Invoice ─────────────────────────────────────────
export interface IInvoice {
  _id: string;
  orderId: string | IOrder;
  invoiceNumber: string;
  customerId: string | IUser;
  pdfUrl: string;
  totalAmount: number;
  gstBreakdown: {
    baseAmount: number;
    gstPercentage: number;
    gstAmount: number;
    totalAmount: number;
  };
  generatedAt: Date;
  emailSentAt?: Date;
}

// ─── Notification ────────────────────────────────────
export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  orderId?: string;
  createdAt: Date;
}

// ─── Supplier Bill ───────────────────────────────────
export interface ISupplierBill {
  _id: string;
  orderId?: string | IOrder;
  vendorName: string;
  billNumber: string;
  billFileUrl: string;
  amount: number;
  indentNumber?: string;
  uploadedBy: string | IUser;
  createdAt: Date;
}

// ─── API Response ────────────────────────────────────
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── Auth ────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
  profileType?: ProfileType;
  organizationName?: string;
}

export interface AuthResponse {
  user: Omit<IUser, 'password' | 'otp' | 'otpExpiry'>;
  accessToken: string;
  refreshToken: string;
}

// ─── Pricing ─────────────────────────────────────────
export interface PriceCalculation {
  basePricePerLiter: number;
  quantity: number;
  baseAmount: number;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;
  city: string;
  fuelType: FuelType;
}
