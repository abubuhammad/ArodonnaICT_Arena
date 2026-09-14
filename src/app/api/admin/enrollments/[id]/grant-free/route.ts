import { NextRequest, NextResponse } from 'next/server';
import { grantFreeEnrollment } from '@/lib/admin';
import { adminGuard, routeError } from '@/app/api/admin/_utils';
import { Permission } from '@/lib/rbac';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await adminGuard(request, Permission.GRANT_FREE_ENROLLMENT); return NextResponse.json(await grantFreeEnrollment((await params).id)); }
  catch (error) { return routeError(error, 'Enrollment not found', 404); }
}
