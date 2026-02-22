import mongoose, { Document, Schema } from 'mongoose';
import { UserRole, ProfileType } from 'shared';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
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

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    organizationName: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    profileType: {
      type: String,
      enum: Object.values(ProfileType),
    },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

export default mongoose.model<IUserDocument>('User', userSchema);
