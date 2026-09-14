import { NextRequest, NextResponse } from 'next/server';
import { assignTemplate } from '@/lib/admin';
import { adminGuard, routeError } from '@/app/api/admin/_utils';
import { Permission } from '@/lib/rbac';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ instructorId: string }> }) {
  try { await adminGuard(request, Permission.MANAGE_CERTIFICATES); return NextResponse.json(await assignTemplate((await params).instructorId, (await request.json()).template)); }
  catch (error) { return routeError(error, 'Failed to assign certificate template'); }
}
