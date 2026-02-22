require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const fuelPriceRoutes = require('./routes/fuelPriceRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ─────────────────────────────────────
app.use(helmet());
app.use(cors());

// Body parser with size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting — 100 requests per 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes',
    data: null,
  },
});
app.use('/api', limiter);

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/fuel-prices', fuelPriceRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Fuel Price Microservice is running',
    data: { uptime: process.uptime(), timestamp: new Date() },
  });
});

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    data: null,
  });
});

// ─── Error Handler (must be last) ───────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 API:  http://localhost:${PORT}/api/fuel-prices`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  });
};

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
