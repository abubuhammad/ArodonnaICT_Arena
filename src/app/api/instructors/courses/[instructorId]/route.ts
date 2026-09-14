import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeThumbnail } from '@/lib/thumbnail';

export async function GET(request: NextRequest, { params }: { params: Promise<{ instructorId: string }> }) {
  try {
    authenticateUser(request.headers);
    const { instructorId } = await params;
    const courses = await prisma.course.findMany({ where: { instructorId }, include: { enrollments: true } });
    return NextResponse.json(courses.map((course) => ({
      _id: course.id,
      title: course.title,
      description: course.description,
      price: Number(course.price),
      isFree: course.isFree,
      thumbnail: normalizeThumbnail(course.thumbnail),
      duration: course.duration || '0 hours',
      level: course.level || 'Beginner',
      instructor: instructorId,
      enrolledStudents: course.enrollments.map((item) => item.userId),
      completedStudents: course.enrollments.filter((item) => item.progressPercentage >= 100).map((item) => item.userId),
      rating: 0,
      revenue: course.enrollments.reduce((sum, item) => sum + Number(item.instructorShareAmount || 0), 0) || (course.isFree ? 0 : Number(course.price) * course.enrollments.length),
    })));
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    return NextResponse.json({ error: 'Failed to fetch instructor courses' }, { status: 500 });
  }
}
