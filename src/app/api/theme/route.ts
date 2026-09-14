import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let theme = await prisma.theme.findFirst({ where: { active: true } });
    if (!theme) {
      theme = await prisma.theme.create({
        data: {
          name: 'Default',
          primaryColor: '#4F46E5',
          secondaryColor: '#A5B4FC',
          backgroundGradient: 'linear-gradient(to right, #4F46E5, #A5B4FC)',
          fontFamily: 'sans-serif',
          active: true,
        },
      });
    }
    return NextResponse.json(theme);
  } catch (error) {
    console.error('Failed to fetch theme:', error);
    return NextResponse.json({ error: 'Failed to fetch theme' }, { status: 500 });
  }
}
