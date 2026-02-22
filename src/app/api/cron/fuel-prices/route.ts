import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/server/database';
import { FuelPrice, User } from '@/lib/server/models';
import { FuelType, UserRole, STATE_GST_RATES } from '@/lib/shared';
import config from '@/lib/server/config';

/**
 * Vercel Cron handler — runs daily to update fuel prices for major Indian cities.
 * Accepts: CRON_SECRET header (Vercel cron) OR a valid admin Bearer JWT.
 */

// Prices: diesel (₹/L), petrol (₹/L), cng (₹/kg), lpg (₹/cylinder 14.2kg)
const MAJOR_CITIES: Array<{ city: string; state: string; prices: Partial<Record<FuelType, number>> }> = [
  { city: 'Mumbai',        state: 'Maharashtra',   prices: { diesel: 94.27, petrol: 104.10, cng: 66.01, lpg: 903.00 } },
  { city: 'Delhi',         state: 'Delhi',          prices: { diesel: 87.62, petrol:  96.72, cng: 75.09, lpg: 903.00 } },
  { city: 'Bangalore',     state: 'Karnataka',      prices: { diesel: 88.94, petrol: 101.94, cng: 86.50, lpg: 906.00 } },
  { city: 'Chennai',       state: 'Tamil Nadu',     prices: { diesel: 93.19, petrol: 102.63, cng: 68.00, lpg: 917.00 } },
  { city: 'Kolkata',       state: 'West Bengal',    prices: { diesel: 90.76, petrol: 105.91, cng: 55.38, lpg: 903.00 } },
  { city: 'Hyderabad',     state: 'Telangana',      prices: { diesel: 95.65, petrol: 109.66, cng: 88.50, lpg: 909.00 } },
  { city: 'Ahmedabad',     state: 'Gujarat',        prices: { diesel: 89.33, petrol:  96.24, cng: 75.00, lpg: 906.00 } },
  { city: 'Pune',          state: 'Maharashtra',    prices: { diesel: 93.80, petrol: 104.69, cng: 80.00, lpg: 903.00 } },
  { city: 'Jaipur',        state: 'Rajasthan',      prices: { diesel: 95.04, petrol: 106.10, cng: 75.50, lpg: 907.00 } },
  { city: 'Lucknow',       state: 'Uttar Pradesh',  prices: { diesel: 89.76, petrol:  96.57, cng: 91.00, lpg: 907.00 } },
  { city: 'Chandigarh',    state: 'Punjab',         prices: { diesel: 86.47, petrol:  97.13, cng: 82.00, lpg: 907.50 } },
  { city: 'Bhopal',        state: 'Madhya Pradesh', prices: { diesel: 93.28, petrol: 108.65, cng: 73.00, lpg: 907.00 } },
  { city: 'Patna',         state: 'Bihar',          prices: { diesel: 94.24, petrol: 107.79, cng: 84.00, lpg: 902.00 } },
  { city: 'Indore',        state: 'Madhya Pradesh', prices: { diesel: 93.28, petrol: 108.65, cng: 73.00, lpg: 907.00 } },
  { city: 'Nagpur',        state: 'Maharashtra',    prices: { diesel: 93.06, petrol: 104.49, cng: 79.00, lpg: 903.00 } },
  { city: 'Noida',         state: 'Uttar Pradesh',  prices: { diesel: 87.62, petrol:  96.72, cng: 76.59, lpg: 903.00 } },
  { city: 'Gurugram',      state: 'Haryana',        prices: { diesel: 87.28, petrol:  96.55, cng: 76.59, lpg: 903.00 } },
  { city: 'Kochi',         state: 'Kerala',         prices: { diesel: 94.47, petrol: 104.53, cng: 67.00, lpg: 921.50 } },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', prices: { diesel: 95.50, petrol: 109.45,             lpg: 909.00 } },
  { city: 'Surat',         state: 'Gujarat',        prices: { diesel: 89.33, petrol:  96.24, cng: 75.00, lpg: 906.00 } },
];

export const GET = async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow: Vercel cron secret OR authenticated admin JWT
  let authorized = false;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    authorized = true;
  } else if (authHeader?.startsWith('Bearer ') && authHeader !== `Bearer ${cronSecret ?? ''}`) {
    try {
      const decoded: any = jwt.verify(authHeader.split(' ')[1], config.jwtSecret);
      const user = await User.findById(decoded.id).select('role');
      if (user?.role === UserRole.ADMIN) authorized = true;
    } catch {}
  } else if (!cronSecret) {
    // No cron secret configured — allow any request (dev mode)
    authorized = true;
  }

  if (!authorized) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    // Load admin-overridden records so we don't overwrite them
    const adminOverrideRecords = await FuelPrice.find({ isAdminOverride: true }, 'city fuelType').lean();
    const overrideSet = new Set(
      adminOverrideRecords.map((p: any) => `${p.city}|${p.fuelType}`)
    );

    let upserted = 0;
    let skipped = 0;

    for (const cityData of MAJOR_CITIES) {
      const gstPercentage =
        (STATE_GST_RATES as Record<string, number>)[cityData.state] ??
        (STATE_GST_RATES as Record<string, number>)['default'] ??
        18;

      for (const [fuelType, defaultPrice] of Object.entries(cityData.prices)) {
        // Preserve admin-set prices
        if (overrideSet.has(`${cityData.city}|${fuelType}`)) {
          skipped++;
          continue;
        }

        await FuelPrice.findOneAndUpdate(
          { city: cityData.city, fuelType },
          {
            $setOnInsert: {
              city: cityData.city,
              state: cityData.state,
              fuelType,
            },
            $set: {
              basePricePerLiter: defaultPrice,
              gstPercentage,
              effectiveDate: new Date(),
              source: 'cron',
              isAdminOverride: false,
              lastUpdatedAt: new Date(),
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        upserted++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Prices synced: ${upserted} updated, ${skipped} admin overrides preserved.`,
      data: { upserted, skipped },
    });
  } catch (error: any) {
    console.error('Fuel price cron error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
};
