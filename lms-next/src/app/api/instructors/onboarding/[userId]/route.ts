import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const countryToCurrency: Record<string, { currency: string; locale: string }> = {
  NG: { currency: 'NGN', locale: 'en-NG' }, US: { currency: 'USD', locale: 'en-US' }, GB: { currency: 'GBP', locale: 'en-GB' },
  CA: { currency: 'CAD', locale: 'en-CA' }, AU: { currency: 'AUD', locale: 'en-AU' }, IN: { currency: 'INR', locale: 'en-IN' },
  ZA: { currency: 'ZAR', locale: 'en-ZA' }, KE: { currency: 'KES', locale: 'en-KE' }, GH: { currency: 'GHS', locale: 'en-GH' }, EU: { currency: 'EUR', locale: 'en-EU' },
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    authenticateUser(request.headers);
    const { userId } = await params;
    const { country, countryCode, bankDetails } = await request.json();
    if (!userId || !country || !countryCode) return NextResponse.json({ error: 'Missing required fields: userId, country, countryCode' }, { status: 400 });
    const mapping = countryToCurrency[String(countryCode).toUpperCase()];
    if (!mapping) return NextResponse.json({ error: `Unknown country code: ${countryCode}` }, { status: 400 });
    const user = await prisma.user.update({ where: { id: userId }, data: { country, countryCode: String(countryCode).toUpperCase(), currency: mapping.currency, locale: mapping.locale, bankDetails: bankDetails || {}, onboardingCompleted: true } });
    return NextResponse.json({ message: 'Instructor onboarding completed', user: { id: user.id, name: user.name, email: user.email, country: user.country, currency: user.currency, locale: user.locale, onboardingCompleted: user.onboardingCompleted } });
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Onboarding failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
