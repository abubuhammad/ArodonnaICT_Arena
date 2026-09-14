import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ instructorId: string }> }) {
  try {
    authenticateUser(request.headers);
    const { instructorId } = await params;
    const courses = await prisma.course.findMany({ where: { instructorId }, include: { enrollments: true } });
    const earnings = courses.flatMap((course) => course.enrollments.filter((item) => item.paymentStatus === 'PAID').map((item) => ({ courseId: course.id, courseTitle: course.title, amount: Number(item.instructorShareAmount || item.amountPaid || 0), date: item.createdAt })));
    return NextResponse.json({ total: earnings.reduce((sum, item) => sum + item.amount, 0), earnings });
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 });
  }
}
