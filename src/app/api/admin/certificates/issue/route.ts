import { NextRequest, NextResponse } from 'next/server';
import { issueCertificate } from '@/lib/admin';
import { adminGuard, routeError } from '@/app/api/admin/_utils';
import { Permission } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try { const actor = await adminGuard(request, Permission.MANAGE_CERTIFICATES); return NextResponse.json(await issueCertificate(await request.json(), actor, request), { status: 201 }); }
  catch (error) { return routeError(error, 'Failed to issue certificate'); }
}
