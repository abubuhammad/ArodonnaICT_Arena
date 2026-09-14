import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureProgress, sanitizeQuestions } from '@/lib/courseProgress';

export async function GET(request: NextRequest, { params }: { params: Promise<{ enrollmentId: string }> }) {
  try {
    const user = authenticateUser(request.headers);
    const { enrollmentId } = await params;
    const enrollment = await prisma.enrollment.findFirst({ where: { id: enrollmentId, userId: user.id }, include: { course: true } });
    if (!enrollment) return NextResponse.json({ error: 'Invalid enrollment' }, { status: 403 });
    const state = await ensureProgress(enrollmentId, user.id);
    const assessment: any = enrollment.course.finalAssessment || {};
    return NextResponse.json({ title: assessment.title || 'Final Assessment', passingScore: assessment.passingScore || 70, questions: sanitizeQuestions(Array.isArray(assessment.questions) ? assessment.questions : []), unlocked: state.modules.every((item) => item.status === 'PASSED') });
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch final assessment' }, { status: 500 });
  }
}
