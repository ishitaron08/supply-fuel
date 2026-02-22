import mongoose, { Document, Schema } from 'mongoose';
import { VehicleType } from 'shared';

export interface IVehicleDocument extends Document {
  vehicleNumber: string;
  type: VehicleType;
  capacity: number;
  driverId?: mongoose.Types.ObjectId;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicleDocument>(
  {
    vehicleNumber: { type: String, required: true, unique: true, trim: true },
    type: {
      type: String,
      enum: Object.values(VehicleType),
      required: true,
    },
    capacity: { type: Number, required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'User' },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

vehicleSchema.index({ isAvailable: 1 });
vehicleSchema.index({ driverId: 1 });

export default mongoose.model<IVehicleDocument>('Vehicle', vehicleSchema);
