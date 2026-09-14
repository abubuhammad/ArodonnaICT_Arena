import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = authenticateUser(request.headers);
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
            category: true,
          },
        },
      },
    });

    return NextResponse.json(
      enrollments.map((item) => ({
        id: item.course.id,
        _id: item.course.id,
        title: item.course.title,
        description: item.course.description,
        instructor: item.course.instructor.name,
        thumbnail: item.course.thumbnail || '/images/course-default.jpg',
        price: item.course.price,
        isFree: item.course.isFree,
        level: item.course.level || 'Beginner',
        duration: item.course.duration || '0 hours',
        category: item.course.category.name,
        enrollmentStatus: item.status,
        progress: item.progressPercentage,
        lastAccessed: item.updatedAt,
      }))
    );
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch enrolled courses' }, { status: 500 });
  }
}
