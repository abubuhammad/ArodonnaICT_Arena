import { NextRequest, NextResponse } from 'next/server';
import { getEnrollments, adminGrantFreeEnrollment } from '@/lib/admin';
import { adminGuard, routeError } from '@/app/api/admin/_utils';
import { Permission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try { await adminGuard(request); return NextResponse.json(await getEnrollments()); }
  catch (error) { return routeError(error, 'Error fetching enrollments'); }
}

export async function POST(request: NextRequest) {
  try { await adminGuard(request, Permission.GRANT_FREE_ENROLLMENT); return NextResponse.json(await adminGrantFreeEnrollment(await request.json()), { status: 201 }); }
  catch (error) { return routeError(error, 'Failed to grant free enrollment'); }
}
