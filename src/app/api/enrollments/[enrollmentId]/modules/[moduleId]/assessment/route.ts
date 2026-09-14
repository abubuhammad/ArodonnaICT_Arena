import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sanitizeQuestions } from '@/lib/courseProgress';

export async function GET(request: NextRequest, { params }: { params: Promise<{ enrollmentId: string; moduleId: string }> }) {
  try {
    const user = authenticateUser(request.headers);
    const { enrollmentId, moduleId } = await params;
    const enrollment = await prisma.enrollment.findFirst({ where: { id: enrollmentId, userId: user.id }, include: { course: { include: { modules: true } } } });
    if (!enrollment) return NextResponse.json({ error: 'Invalid enrollment' }, { status: 403 });
    const courseModule = enrollment.course.modules.find((item) => item.id === moduleId);
    if (!courseModule) return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    const assessment: any = courseModule.assessment || {};
    return NextResponse.json({ title: assessment.title || 'Module Assessment', passingScore: assessment.passingScore || 70, questions: sanitizeQuestions(Array.isArray(assessment.questions) ? assessment.questions : []) });
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch module assessment' }, { status: 500 });
  }
}
