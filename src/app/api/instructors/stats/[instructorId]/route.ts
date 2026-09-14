import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ instructorId: string }> }) {
  try {
    authenticateUser(request.headers);
    const { instructorId } = await params;
    const courses = await prisma.course.findMany({ where: { instructorId }, include: { enrollments: true } });
    const enrollments = courses.flatMap((course) => course.enrollments);
    const completed = enrollments.filter((item) => item.progressPercentage >= 100).length;
    const revenue = enrollments.reduce((sum, item) => sum + Number(item.instructorShareAmount || 0), 0) || courses.reduce((sum, course) => sum + (course.isFree ? 0 : Number(course.price) * course.enrollments.length), 0);
    return NextResponse.json({ totalStudents: new Set(enrollments.map((item) => item.userId)).size, totalCourses: courses.length, completionRate: enrollments.length ? Math.round(completed / enrollments.length * 100) : 0, activeEnrollments: enrollments.length, averageRating: 0, totalRevenue: revenue });
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    return NextResponse.json({ error: 'Failed to fetch instructor statistics' }, { status: 500 });
  }
}
