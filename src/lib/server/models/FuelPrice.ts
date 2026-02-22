import mongoose, { Document, Schema } from 'mongoose';
import { FuelType } from '@/lib/shared';

export interface IFuelPriceDocument extends Document {
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

const fuelPriceSchema = new Schema<IFuelPriceDocument>(
  {
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    fuelType: {
      type: String,
      enum: Object.values(FuelType),
      default: FuelType.DIESEL,
    },
    basePricePerLiter: { type: Number, required: true },
    gstPercentage: { type: Number, required: true, default: 18 },
    effectiveDate: { type: Date, default: Date.now },
    source: { type: String, default: 'manual' },
    isAdminOverride: { type: Boolean, default: false },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

fuelPriceSchema.index({ city: 1, fuelType: 1 }, { unique: true });
fuelPriceSchema.index({ state: 1 });

export default mongoose.models.FuelPrice ||
  mongoose.model<IFuelPriceDocument>('FuelPrice', fuelPriceSchema);
