import { NextResponse } from 'next/server';

export const GET = async () => {
  return NextResponse.json({
    success: true,
    message: 'Petrol delivery API is running',
    data: { timestamp: new Date().toISOString() },
  });
};
