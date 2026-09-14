import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.role === 'INSTRUCTOR') return NextResponse.json({ message: 'Already an instructor' });
    await prisma.user.update({ where: { id: user.id }, data: { role: 'PENDING' } });
    return NextResponse.json({ message: 'Instructor request submitted for approval' });
  } catch {
    return NextResponse.json({ error: 'Failed to request instructor role' }, { status: 500 });
  }
}
