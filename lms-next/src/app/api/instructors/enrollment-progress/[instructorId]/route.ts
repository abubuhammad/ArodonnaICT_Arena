import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ instructorId: string }> }) {
  try {
    authenticateUser(request.headers);
    const { instructorId } = await params;
    const courses = await prisma.course.findMany({ where: { instructorId }, select: { id: true, title: true } });
    const enrollments = await prisma.enrollment.findMany({ where: { courseId: { in: courses.map((course) => course.id) } }, include: { user: { select: { name: true, email: true } }, course: { select: { title: true } } }, orderBy: { enrolledAt: 'desc' } });
    return NextResponse.json(enrollments.map((item) => ({ enrollmentId: item.id, user: item.user, course: item.course, enrolledAt: item.enrolledAt, progress: { status: item.progressPercentage >= 100 ? 'completed' : item.progressPercentage > 0 ? 'in-progress' : 'not-started', completedLessons: 0, totalLessons: 0, percentage: item.progressPercentage } })));
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    return NextResponse.json({ error: 'Failed to fetch enrollment progress' }, { status: 500 });
  }
}
