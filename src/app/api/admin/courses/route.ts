import { NextRequest, NextResponse } from 'next/server';
import { getCourses } from '@/lib/admin';
import { adminGuard, routeError } from '@/app/api/admin/_utils';

export async function GET(request: NextRequest) {
  try { await adminGuard(request); return NextResponse.json(await getCourses(new URL(request.url).searchParams)); }
  catch (error) { return routeError(error, 'Failed to fetch courses'); }
}
