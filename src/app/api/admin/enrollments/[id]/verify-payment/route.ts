import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/admin';
import { adminGuard, routeError } from '@/app/api/admin/_utils';
import { Permission } from '@/lib/rbac';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await adminGuard(request); return NextResponse.json(await verifyPayment((await params).id, Boolean((await request.json()).verified))); }
  catch (error) { return routeError(error, 'Enrollment not found', 404); }
}
