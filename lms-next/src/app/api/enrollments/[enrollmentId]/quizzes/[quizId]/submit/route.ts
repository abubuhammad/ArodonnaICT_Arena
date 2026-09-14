import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { submitQuiz } from '@/lib/courseProgress';

export async function POST(request: NextRequest, { params }: { params: Promise<{ enrollmentId: string; quizId: string }> }) {
  try {
    const user = authenticateUser(request.headers);
    const { enrollmentId, quizId } = await params;
    const body = await request.json();
    const result = await submitQuiz(enrollmentId, user.id, quizId, body.answers);
    return NextResponse.json({ message: 'Quiz submitted', result });
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    const message = error instanceof Error ? error.message : '';
    const status = message.includes('not found') ? 404 : message.includes('Invalid enrollment') ? 403 : message.includes('No attempts remaining') ? 409 : 500;
    return NextResponse.json({ error: message || 'Failed to submit quiz' }, { status });
  }
}
