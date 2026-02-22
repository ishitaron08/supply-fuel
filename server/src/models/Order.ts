import mongoose, { Document, Schema } from 'mongoose';
import { FuelType, OrderStatus, PaymentMode, PaymentStatus } from 'shared';

export interface IOrderDocument extends Document {
  orderNumber: string;
  customerId: mongoose.Types.ObjectId;
  deliverySiteId: mongoose.Types.ObjectId;
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
  assignedPartnerId?: mongoose.Types.ObjectId;
  assignedVehicleId?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  deliveredAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deliverySiteId: { type: Schema.Types.ObjectId, ref: 'DeliverySite', required: true },
    fuelType: {
      type: String,
      enum: Object.values(FuelType),
      default: FuelType.DIESEL,
    },
    quantityLiters: { type: Number, required: true, min: 1 },
    pricePerLiter: { type: Number, required: true },
    gstPercentage: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    requestedDeliveryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    paymentMode: {
      type: String,
      enum: Object.values(PaymentMode),
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    assignedPartnerId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedVehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    rejectionReason: { type: String },
    deliveredAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ assignedPartnerId: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model<IOrderDocument>('Order', orderSchema);
