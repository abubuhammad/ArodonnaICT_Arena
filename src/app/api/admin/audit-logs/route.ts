import { NextRequest, NextResponse } from 'next/server';
import { auditLogs } from '@/lib/admin';
import { adminGuard, routeError } from '@/app/api/admin/_utils';
import { Permission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try { await adminGuard(request, Permission.VIEW_AUDIT_LOGS); return NextResponse.json(await auditLogs(new URL(request.url).searchParams)); }
  catch (error) { return routeError(error, 'Failed to list audit logs'); }
}
