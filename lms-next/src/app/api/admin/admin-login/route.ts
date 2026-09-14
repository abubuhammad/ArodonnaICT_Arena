import { NextRequest, NextResponse } from 'next/server';
import { adminLogin } from '@/lib/admin';
import { routeError } from '@/app/api/admin/_utils';

export async function POST(request: NextRequest) {
  try { return NextResponse.json(await adminLogin(await request.json())); }
  catch (error) { return routeError(error, 'Internal Server Error'); }
}
