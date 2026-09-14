import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = authenticateUser(request.headers);
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
