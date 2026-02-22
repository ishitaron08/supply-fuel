import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import config from './config';
import connectDB from './config/database';
import { errorHandler } from './middleware';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import siteRoutes from './routes/sites';
import orderRoutes from './routes/orders';
import pricingRoutes from './routes/pricing';
import paymentRoutes from './routes/payments';
import vehicleRoutes from './routes/vehicles';
import notificationRoutes from './routes/notifications';
import invoiceRoutes from './routes/invoices';
import supplierBillRoutes from './routes/supplierBills';

// Cron
import { startFuelPriceCron, seedFuelPrices } from './cron/fetchFuelPrices';

const app = express();

// Middleware
app.use(helmet());
const allowedOrigins = [config.clientUrl, 'http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/supplier-bills', supplierBillRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Fuel Order Platform API is running', timestamp: new Date() });
});

// Error handler
app.use(errorHandler);

// Start server
const start = async () => {
  await connectDB();
  await seedFuelPrices();
  startFuelPriceCron();

  app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
    console.log(`📍 API: http://localhost:${config.port}/api`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
  });
};

start().catch(console.error);

export default app;
