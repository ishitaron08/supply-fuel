// GST rates by state (percentage)
export const STATE_GST_RATES: Record<string, number> = {
  'Maharashtra': 18,
  'Delhi': 18,
  'Karnataka': 18,
  'Tamil Nadu': 18,
  'Gujarat': 18,
  'Rajasthan': 18,
  'Uttar Pradesh': 18,
  'Madhya Pradesh': 18,
  'West Bengal': 18,
  'Telangana': 18,
  'Andhra Pradesh': 18,
  'Kerala': 18,
  'Punjab': 18,
  'Haryana': 18,
  'Bihar': 18,
  'Odisha': 18,
  'Jharkhand': 18,
  'Chhattisgarh': 18,
  'Assam': 18,
  'Goa': 18,
  'default': 18,
};

// Default diesel price (fallback if API fails)
export const DEFAULT_DIESEL_PRICE = 89.62;

// Order number prefix
export const ORDER_PREFIX = 'ORD';
export const INVOICE_PREFIX = 'INV';

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

// OTP config
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 10;

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

// Minimum order quantity (liters)
export const MIN_ORDER_QUANTITY = 500;
export const MAX_ORDER_QUANTITY = 50000;
