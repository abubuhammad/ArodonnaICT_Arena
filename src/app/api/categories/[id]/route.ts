import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authenticateAdmin(request.headers);
    const { id } = await params;
    const { name } = await request.json();
    try {
      const updatedCategory = await prisma.category.update({ where: { id }, data: { name } });
      return NextResponse.json({ message: 'Category updated', category: { ...updatedCategory, _id: updatedCategory.id } });
    } catch {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 403 });
    console.error('Failed to update category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authenticateAdmin(request.headers);
    const { id } = await params;
    try {
      await prisma.category.delete({ where: { id } });
      return NextResponse.json({ message: 'Category deleted' });
    } catch {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 403 });
    console.error('Failed to delete category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
