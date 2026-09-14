import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = authenticateUser(request.headers);
    const enrollments = await prisma.enrollment.findMany({ where: { userId: user.id } });
    const completed = enrollments.filter((item) => item.progressPercentage >= 100 || item.status === 'COMPLETED').length;
    const average = enrollments.length ? enrollments.reduce((sum, item) => sum + item.progressPercentage, 0) / enrollments.length : 0;

    return NextResponse.json({
      totalEnrolled: enrollments.length,
      coursesCompleted: completed,
      certificatesEarned: completed,
      averageProgress: Math.round(average),
      totalHoursLearned: enrollments.length * 10,
      achievements: enrollments.length,
    });
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch student stats' }, { status: 500 });
  }
}
