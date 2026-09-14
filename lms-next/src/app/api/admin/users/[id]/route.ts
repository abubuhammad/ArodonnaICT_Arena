import { NextRequest, NextResponse } from 'next/server';
import { deleteUser } from '@/lib/admin';
import { adminGuard, routeError } from '@/app/api/admin/_utils';
import { Permission } from '@/lib/rbac';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { const actor = await adminGuard(request, Permission.DELETE_USER); return NextResponse.json(await deleteUser((await params).id, actor, request)); }
  catch (error) { return routeError(error, 'Failed to delete user'); }
}
