import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { viewLesson } from '@/lib/courseProgress';

export async function POST(request: NextRequest, { params }: { params: Promise<{ enrollmentId: string; lessonId: string }> }) {
  try {
    const user = authenticateUser(request.headers);
    const { enrollmentId, lessonId } = await params;
    const lessonProgress = await viewLesson(enrollmentId, user.id, lessonId);
    return NextResponse.json({ message: 'Lesson viewed', lessonProgress });
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    const message = error instanceof Error ? error.message : '';
    const status = message.includes('Progress not found') || message.includes('not found') ? 404 : message.includes('not owned') || message.includes('invalid enrollment') ? 403 : message.includes('locked') ? 409 : message.includes('Lesson progress') ? 422 : 500;
    return NextResponse.json({ error: message || 'Failed to view lesson' }, { status });
  }
}
