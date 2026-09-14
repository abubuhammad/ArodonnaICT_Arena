import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    authenticateAdmin(request.headers);
    const { userId } = await params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.role !== 'PENDING') return NextResponse.json({ error: 'User has not requested instructor role' }, { status: 400 });
    await prisma.user.update({ where: { id: user.id }, data: { role: 'INSTRUCTOR' } });
    return NextResponse.json({ message: 'Instructor role approved successfully' });
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 403 });
    return NextResponse.json({ error: 'Failed to approve instructor role' }, { status: 500 });
  }
}
