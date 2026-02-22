import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplierBillDocument extends Document {
  orderId?: mongoose.Types.ObjectId;
  vendorName: string;
  billNumber: string;
  billFileUrl: string;
  amount: number;
  indentNumber?: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const supplierBillSchema = new Schema<ISupplierBillDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    vendorName: { type: String, required: true, trim: true },
    billNumber: { type: String, required: true, trim: true },
    billFileUrl: { type: String, required: true },
    amount: { type: Number, required: true },
    indentNumber: { type: String, trim: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

supplierBillSchema.index({ orderId: 1 });
supplierBillSchema.index({ vendorName: 1 });

export default mongoose.model<ISupplierBillDocument>('SupplierBill', supplierBillSchema);
