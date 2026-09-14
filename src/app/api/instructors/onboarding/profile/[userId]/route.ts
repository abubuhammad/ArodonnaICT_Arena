import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    authenticateUser(request.headers);
    const { userId } = await params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role, country: user.country, countryCode: user.countryCode, currency: user.currency, locale: user.locale, bankDetails: user.bankDetails, onboardingCompleted: user.onboardingCompleted });
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
