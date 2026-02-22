/**
 * Seed script — inserts sample fuel prices for Delhi, Mumbai, Bangalore.
 * Usage:  npm run seed
 */
require('dotenv').config();

const mongoose = require('mongoose');
const FuelPrice = require('./models/FuelPrice');

const SEED_DATA = [
  { city: 'Delhi', petrol: 96.72, diesel: 89.62 },
  { city: 'Mumbai', petrol: 106.31, diesel: 94.27 },
  { city: 'Bangalore', petrol: 101.94, diesel: 87.89 },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    for (const entry of SEED_DATA) {
      await FuelPrice.findOneAndUpdate(
        { city: new RegExp(`^${entry.city}$`, 'i') },
        { ...entry, lastUpdated: new Date() },
        { upsert: true, new: true, runValidators: true }
      );
      console.log(`  ✔ ${entry.city} — Petrol: ₹${entry.petrol}, Diesel: ₹${entry.diesel}`);
    }

    console.log('\n🎉 Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
