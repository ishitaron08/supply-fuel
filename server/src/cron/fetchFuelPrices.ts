import cron from 'node-cron';
import { FuelPrice } from '../models';
import { FuelType, DEFAULT_DIESEL_PRICE, STATE_GST_RATES } from 'shared';

// Major Indian cities with fallback prices
const MAJOR_CITIES: Array<{ city: string; state: string; defaultPrice: number }> = [
  { city: 'Mumbai', state: 'Maharashtra', defaultPrice: 94.27 },
  { city: 'Delhi', state: 'Delhi', defaultPrice: 87.62 },
  { city: 'Bangalore', state: 'Karnataka', defaultPrice: 88.94 },
  { city: 'Chennai', state: 'Tamil Nadu', defaultPrice: 93.19 },
  { city: 'Kolkata', state: 'West Bengal', defaultPrice: 90.76 },
  { city: 'Hyderabad', state: 'Telangana', defaultPrice: 95.65 },
  { city: 'Ahmedabad', state: 'Gujarat', defaultPrice: 89.33 },
  { city: 'Pune', state: 'Maharashtra', defaultPrice: 93.80 },
  { city: 'Jaipur', state: 'Rajasthan', defaultPrice: 95.04 },
  { city: 'Lucknow', state: 'Uttar Pradesh', defaultPrice: 89.76 },
  { city: 'Chandigarh', state: 'Punjab', defaultPrice: 86.47 },
  { city: 'Bhopal', state: 'Madhya Pradesh', defaultPrice: 93.28 },
  { city: 'Patna', state: 'Bihar', defaultPrice: 94.24 },
  { city: 'Indore', state: 'Madhya Pradesh', defaultPrice: 93.28 },
  { city: 'Nagpur', state: 'Maharashtra', defaultPrice: 93.06 },
  { city: 'Noida', state: 'Uttar Pradesh', defaultPrice: 87.62 },
  { city: 'Gurugram', state: 'Haryana', defaultPrice: 87.28 },
  { city: 'Kochi', state: 'Kerala', defaultPrice: 94.47 },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', defaultPrice: 95.50 },
  { city: 'Surat', state: 'Gujarat', defaultPrice: 89.33 },
];

const fetchAndUpdatePrices = async () => {
  console.log('🔄 Running fuel price update cron job...');

  try {
    // Attempt to fetch from external API
    // Using a placeholder — replace with actual API integration (e.g., data.gov.in, mfapps.in, etc.)
    let apiPrices: Record<string, number> | null = null;

    try {
      // Example: If you have an API key and endpoint
      // const response = await fetch(`https://api.example.com/fuel-prices?key=${config.fuelPriceApiKey}`);
      // apiPrices = await response.json();
      console.log('ℹ️  No external API configured. Using fallback city prices.');
    } catch {
      console.log('⚠️  External API call failed. Using fallback prices.');
    }

    // Upsert prices for all major cities
    for (const cityData of MAJOR_CITIES) {
      const price = apiPrices?.[cityData.city] || cityData.defaultPrice;
      const gstPercentage = STATE_GST_RATES[cityData.state] || STATE_GST_RATES['default'];

      await FuelPrice.findOneAndUpdate(
        { city: cityData.city, fuelType: FuelType.DIESEL },
        {
          $setOnInsert: { city: cityData.city, state: cityData.state, fuelType: FuelType.DIESEL },
          $set: {
            basePricePerLiter: price,
            gstPercentage,
            effectiveDate: new Date(),
            source: apiPrices ? 'external_api' : 'fallback',
            lastUpdatedAt: new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log(`✅ Fuel prices updated for ${MAJOR_CITIES.length} cities.`);
  } catch (error) {
    console.error('❌ Fuel price cron job error:', error);
  }
};

export const startFuelPriceCron = () => {
  // Run daily at 6:00 AM IST
  cron.schedule('0 6 * * *', fetchAndUpdatePrices, {
    timezone: 'Asia/Kolkata',
  });

  console.log('⏰ Fuel price cron job scheduled (daily at 6:00 AM IST)');
};

// Run once on startup to seed prices
export const seedFuelPrices = async () => {
  const count = await FuelPrice.countDocuments();
  if (count === 0) {
    console.log('📦 Seeding initial fuel prices...');
    await fetchAndUpdatePrices();
  }
};
