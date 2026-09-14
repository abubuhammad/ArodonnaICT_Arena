import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const setting = await prisma.platformSetting.findFirst({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json(setting || { platformSharePercent: 20 });
  } catch (error) {
    console.error('Failed to fetch platform settings', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await authenticateAdmin(request.headers);
    const { platformSharePercent } = await request.json();

    if (
      typeof platformSharePercent !== 'number' ||
      platformSharePercent < 0 ||
      platformSharePercent > 100
    ) {
      return NextResponse.json({ error: 'Invalid platformSharePercent' }, { status: 400 });
    }

    let setting = await prisma.platformSetting.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!setting) {
      setting = await prisma.platformSetting.create({ data: { platformSharePercent } });
    } else {
      setting = await prisma.platformSetting.update({
        where: { id: setting.id },
        data: { platformSharePercent },
      });
    }

    return NextResponse.json({ message: 'Settings updated', setting });
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: Number((error as any).status) || 403 }
      );
    }

    console.error('Failed to update platform settings', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
