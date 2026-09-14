import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { completeLessonNoQuiz } from '@/lib/courseProgress';

export async function POST(request: NextRequest, { params }: { params: Promise<{ enrollmentId: string; lessonId: string }> }) {
  try {
    const user = authenticateUser(request.headers);
    const { enrollmentId, lessonId } = await params;
    const lessonProgress = await completeLessonNoQuiz(enrollmentId, user.id, lessonId);
    return NextResponse.json({ message: 'Lesson completed', lessonProgress });
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    const message = error instanceof Error ? error.message : '';
    const status = message.includes('not found') ? 404 : message.includes('not owned') || message.includes('invalid enrollment') ? 403 : message.includes('has a quiz') || message.includes('locked') ? 409 : message.includes('Lesson progress') ? 422 : 500;
    return NextResponse.json({ error: message || 'Failed to complete lesson' }, { status });
  }
}
