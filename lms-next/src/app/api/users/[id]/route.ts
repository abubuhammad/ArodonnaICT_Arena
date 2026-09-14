import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = authenticateUser(request.headers);
    const { id } = await params;

    if (user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      title: dbUser.title,
      bio: dbUser.bio,
      avatar: dbUser.avatar,
      isAvailableForCall: dbUser.isAvailableForCall,
      expertise: dbUser.expertise,
      socialLinks: dbUser.socialLinks,
    });
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = authenticateUser(request.headers);
    const { id } = await params;

    if (user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = await request.json();
    const dbUser = await prisma.user.update({
      where: { id },
      data: {
        name: updates.name,
        title: updates.title,
        bio: updates.bio,
        avatar: updates.avatar,
        isAvailableForCall: updates.isAvailableForCall,
        expertise: updates.expertise,
        socialLinks: updates.socialLinks,
      },
    });

    return NextResponse.json({
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      title: dbUser.title,
      bio: dbUser.bio,
      avatar: dbUser.avatar,
      isAvailableForCall: dbUser.isAvailableForCall,
      expertise: dbUser.expertise,
      socialLinks: dbUser.socialLinks,
    });
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    }

    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
