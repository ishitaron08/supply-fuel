import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^\d{10,15}$/, 'Phone must contain 10 to 15 digits only'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    profileType: z.enum(['organization', 'individual']).optional(),
    organizationName: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const createSiteSchema = z.object({
  body: z.object({
    siteName: z.string().min(2, 'Site name is required'),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().min(6, 'Valid pincode required'),
    contactPerson: z.string().min(2, 'Contact person is required'),
    contactPhone: z.string().min(10, 'Valid phone number required'),
  }),
});

export const createOrderSchema = z.object({
  body: z.object({
    deliverySiteId: z.string().min(1, 'Delivery site is required'),
    fuelType: z.enum(['diesel']),
    quantityLiters: z.number().min(500, 'Minimum order is 500 liters').max(50000, 'Maximum order is 50,000 liters'),
    requestedDeliveryDate: z.string().min(1, 'Delivery date is required'),
    paymentMode: z.enum(['cod']).optional(),
    notes: z.string().optional(),
  }),
});

export const assignOrderSchema = z.object({
  body: z.object({
    partnerId: z.string().min(1, 'Delivery partner is required'),
    vehicleId: z.string().min(1, 'Vehicle is required'),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const rejectOrderSchema = z.object({
  body: z.object({
    reason: z.string().min(5, 'Rejection reason is required'),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const createVehicleSchema = z.object({
  body: z.object({
    vehicleNumber: z.string().min(4, 'Vehicle number is required'),
    type: z.enum(['tanker', 'mini_tanker']),
    capacity: z.number().min(500, 'Capacity must be at least 500 liters'),
    driverId: z.string().optional(),
  }),
});

export const uploadBillSchema = z.object({
  body: z.object({
    vendorName: z.string().min(2, 'Vendor name is required'),
    billNumber: z.string().min(1, 'Bill number is required'),
    amount: z.number().positive('Amount must be positive'),
    orderId: z.string().optional(),
    indentNumber: z.string().optional(),
  }),
});

export const updatePriceSchema = z.object({
  body: z.object({
    basePricePerLiter: z.number().positive('Price must be positive'),
    gstPercentage: z.number().min(0).max(100).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});
