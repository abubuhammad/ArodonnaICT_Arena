import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureProgress, startCourse } from '@/lib/courseProgress';

export async function GET(request: NextRequest, { params }: { params: Promise<{ enrollmentId: string }> }) {
  try {
    const user = authenticateUser(request.headers);
    const { enrollmentId } = await params;
    const enrollment = await prisma.enrollment.findFirst({ where: { id: enrollmentId, userId: user.id }, include: { course: { include: { modules: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' } } } } } }, courseProgress: true } });
    if (!enrollment) return NextResponse.json({ error: 'Enrollment not found or not owned by user' }, { status: 404 });
    if (!enrollment.courseProgress) await startCourse(enrollment.id, user.id);
    const state = await ensureProgress(enrollment.id, user.id);
    return NextResponse.json({ enrollmentId: enrollment.id, status: enrollment.status, progressPercentage: enrollment.progressPercentage, modules: state.modules });
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch enrollment progress' }, { status: 500 });
  }
}
