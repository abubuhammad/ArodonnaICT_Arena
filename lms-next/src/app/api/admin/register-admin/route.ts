import { NextRequest, NextResponse } from 'next/server';
import { registerAdmin } from '@/lib/admin';
import { routeError } from '@/app/api/admin/_utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const setupToken = request.headers.get('x-setup-token');
    return NextResponse.json(await registerAdmin({ ...body, setupToken }), { status: 201 });
  } catch (error) { return routeError(error, 'Failed to create admin'); }
}
