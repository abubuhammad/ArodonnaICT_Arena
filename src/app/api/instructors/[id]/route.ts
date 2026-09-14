import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    authenticateUser(request.headers);
    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, title: true, avatar: true, bio: true, isAvailableForCall: true, expertise: true, socialLinks: true } });
    if (!user) return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    return NextResponse.json({ error: 'Failed to fetch instructor profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = authenticateUser(request.headers);
    await params;
    const body = await request.json();
    const updated = await prisma.user.update({ where: { id: user.id }, data: { name: body.name, title: body.title, bio: body.bio, avatar: body.avatar, isAvailableForCall: body.isAvailableForCall, expertise: body.expertise, socialLinks: body.socialLinks } });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    return NextResponse.json({ error: 'Failed to update instructor profile' }, { status: 500 });
  }
}
