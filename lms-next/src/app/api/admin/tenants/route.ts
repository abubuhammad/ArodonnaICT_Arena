import { NextRequest, NextResponse } from 'next/server';
import { listTenants } from '@/lib/admin';
import { superAdminGuard, routeError } from '@/app/api/admin/_utils';

export async function GET(request: NextRequest) {
  try { await superAdminGuard(request); return NextResponse.json(await listTenants()); }
  catch (error) { return routeError(error, 'Failed to list tenants'); }
}
