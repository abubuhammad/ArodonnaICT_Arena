import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = authenticateUser(request.headers);
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: dbUser.id,
      name: dbUser.name,
      role: dbUser.role,
      email: dbUser.email,
    });
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    }

    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
