import { NextRequest, NextResponse } from 'next/server';
import { funnels } from '@/lib/admin';
import { adminGuard, routeError } from '@/app/api/admin/_utils';
import { Permission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try { await adminGuard(request, Permission.VIEW_ANALYTICS); return NextResponse.json(await funnels(new URL(request.url).searchParams)); }
  catch (error) { return routeError(error, 'Failed to fetch funnels data'); }
}
