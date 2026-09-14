import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = authenticateUser(request.headers);
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      include: { course: { include: { instructor: { select: { name: true } }, category: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(enrollments.map((enrollment) => ({
      _id: enrollment.id,
      userId: enrollment.userId,
      courseId: enrollment.course ? { _id: enrollment.course.id, title: enrollment.course.title } : undefined,
      status: enrollment.status,
      paymentStatus: enrollment.paymentStatus,
      paymentMethod: enrollment.paymentMethod || undefined,
      paymentReference: enrollment.paymentReference || undefined,
      createdAt: enrollment.createdAt,
      progressPercentage: enrollment.progressPercentage,
    })));
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Error fetching enrollments' }, { status: 500 });
  }
}
