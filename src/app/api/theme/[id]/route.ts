import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authenticateAdmin(request.headers);
    const { id } = await params;
    const updateData = await request.json();

    if (updateData.active) {
      await prisma.theme.updateMany({ where: { id: { not: id }, active: true }, data: { active: false } });
    }

    const updatedTheme = await prisma.theme.update({
      where: { id },
      data: {
        name: updateData.name,
        primaryColor: updateData.primaryColor,
        secondaryColor: updateData.secondaryColor,
        backgroundGradient: updateData.backgroundGradient,
        fontFamily: updateData.fontFamily,
        logoUrl: updateData.logoUrl,
        active: updateData.active,
      },
    });

    return NextResponse.json({ message: 'Theme updated successfully', theme: updatedTheme });
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 403 });
    console.error('Failed to update theme:', error);
    return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
  }
}
