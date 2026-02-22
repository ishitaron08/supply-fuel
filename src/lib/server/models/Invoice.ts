import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceDocument extends Document {
  orderId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  customerId: mongoose.Types.ObjectId;
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

const invoiceSchema = new Schema<IInvoiceDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pdfUrl: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    gstBreakdown: {
      baseAmount: { type: Number, required: true },
      gstPercentage: { type: Number, required: true },
      gstAmount: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
    },
    generatedAt: { type: Date, default: Date.now },
    emailSentAt: { type: Date },
  },
  { timestamps: true }
);

invoiceSchema.index({ orderId: 1 });
invoiceSchema.index({ customerId: 1 });

export default mongoose.models.Invoice ||
  mongoose.model<IInvoiceDocument>('Invoice', invoiceSchema);
