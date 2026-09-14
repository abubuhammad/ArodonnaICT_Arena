import { NextRequest, NextResponse } from 'next/server';
import { clearMetrics } from '@/lib/admin';
import { adminRoleGuard, routeError } from '@/app/api/admin/_utils';

export async function POST(request: NextRequest) {
  try { await adminRoleGuard(request); const body = await request.json().catch(() => ({})); const queryKey = new URL(request.url).searchParams.get('key'); return NextResponse.json(await clearMetrics(body.key || queryKey || undefined)); }
  catch (error) { return routeError(error, 'Failed to clear cache'); }
}
