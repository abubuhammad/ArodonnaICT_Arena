import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { startCourse } from '@/lib/courseProgress';

export async function POST(request: NextRequest, { params }: { params: Promise<{ enrollmentId: string }> }) {
  try {
    const user = authenticateUser(request.headers);
    const { enrollmentId } = await params;
    await startCourse(enrollmentId, user.id);
    return NextResponse.json({ message: 'Course started' });
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    console.error('startCourseHandler error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to start course' }, { status: 500 });
  }
}
