import mongoose, { Document, Schema } from 'mongoose';

export interface IDeliverySiteDocument extends Document {
  userId: mongoose.Types.ObjectId;
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

const deliverySiteSchema = new Schema<IDeliverySiteDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    siteName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    geoLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

deliverySiteSchema.index({ userId: 1 });
deliverySiteSchema.index({ city: 1 });

export default mongoose.model<IDeliverySiteDocument>('DeliverySite', deliverySiteSchema);
