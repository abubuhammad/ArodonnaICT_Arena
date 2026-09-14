import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sanitizeQuestions } from '@/lib/courseProgress';

export async function GET(request: NextRequest, { params }: { params: Promise<{ enrollmentId: string; lessonId: string }> }) {
  try {
    const user = authenticateUser(request.headers);
    const { enrollmentId, lessonId } = await params;
    const enrollment = await prisma.enrollment.findFirst({ where: { id: enrollmentId, userId: user.id } });
    if (!enrollment) return NextResponse.json({ error: 'Invalid enrollment' }, { status: 403 });
    const quiz = await prisma.quiz.findFirst({ where: { lessonId }, orderBy: { createdAt: 'desc' } });
    if (!quiz) return NextResponse.json({ error: 'No quiz found for this lesson' }, { status: 404 });
    return NextResponse.json({ id: quiz.id, title: quiz.title, passingScore: quiz.passingScore, attemptsAllowed: quiz.attemptsAllowed, questions: sanitizeQuestions(Array.isArray(quiz.legacyQuestions) ? quiz.legacyQuestions as any[] : []) });
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch quiz' }, { status: 500 });
  }
}
