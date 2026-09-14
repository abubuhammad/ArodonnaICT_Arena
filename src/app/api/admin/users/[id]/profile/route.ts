import { NextRequest, NextResponse } from 'next/server';
import { getLearnerProfile } from '@/lib/admin';
import { adminGuard, routeError } from '@/app/api/admin/_utils';
import { Permission } from '@/lib/rbac';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await adminGuard(request, Permission.LIST_USERS); return NextResponse.json(await getLearnerProfile((await params).id)); }
  catch (error) { return routeError(error, 'Failed to fetch learner profile'); }
}
