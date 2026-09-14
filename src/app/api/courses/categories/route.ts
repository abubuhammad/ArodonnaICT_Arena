import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    authenticateUser(request.headers);
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(categories.map((category) => category.name));
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
