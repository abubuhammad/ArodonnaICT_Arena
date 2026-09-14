import { NextRequest, NextResponse } from 'next/server';
import { approveInstructor } from '@/lib/admin';
import { adminGuard, routeError } from '@/app/api/admin/_utils';
import { Permission } from '@/lib/rbac';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await adminGuard(request, Permission.APPROVE_INSTRUCTOR); return NextResponse.json(await approveInstructor((await params).id)); }
  catch (error) { return routeError(error, 'Failed to approve instructor'); }
}
