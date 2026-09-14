import { NextRequest, NextResponse } from 'next/server';
import { getUsers } from '@/lib/admin';
import { adminGuard, routeError } from '@/app/api/admin/_utils';
import { Permission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try { await adminGuard(request, Permission.LIST_USERS); return NextResponse.json(await getUsers()); }
  catch (error) { return routeError(error, 'Error fetching users'); }
}
