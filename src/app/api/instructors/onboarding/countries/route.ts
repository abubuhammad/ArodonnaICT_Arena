import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ countries: [
    { code: 'NG', name: 'Nigeria', currency: 'NGN' }, { code: 'US', name: 'United States', currency: 'USD' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP' }, { code: 'CA', name: 'Canada', currency: 'CAD' },
    { code: 'AU', name: 'Australia', currency: 'AUD' }, { code: 'IN', name: 'India', currency: 'INR' },
    { code: 'ZA', name: 'South Africa', currency: 'ZAR' }, { code: 'KE', name: 'Kenya', currency: 'KES' },
    { code: 'GH', name: 'Ghana', currency: 'GHS' }, { code: 'EU', name: 'Europe', currency: 'EUR' },
  ] });
}
