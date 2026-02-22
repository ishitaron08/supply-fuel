import dotenv from 'dotenv';
import path from 'path';

// Load .env from repository root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const config = {
  // Server
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  // MongoDB
  mongoUri: process.env.MONGODB_URI || '',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Razorpay
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',

  // SMTP
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',

  // Fuel Price API
  fuelPriceApiKey: process.env.FUEL_PRICE_API_KEY || '',

  // Uploads
  uploadDir: path.resolve(__dirname, '../uploads'),
};

export default config;
