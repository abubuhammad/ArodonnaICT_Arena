import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { submitFinalAssessment } from '@/lib/courseProgress';

export async function POST(request: NextRequest, { params }: { params: Promise<{ enrollmentId: string }> }) {
  try {
    const user = authenticateUser(request.headers);
    const { enrollmentId } = await params;
    const body = await request.json();
    const result = await submitFinalAssessment(enrollmentId, user.id, body.answers || []);
    return NextResponse.json({ message: result.passed ? 'Final assessment passed. Certificate issued.' : 'Final assessment not passed. Please try again.', result });
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    const message = error instanceof Error ? error.message : '';
    const status = message.includes('Invalid enrollment') ? 403 : message.includes('must be passed') || message.includes('no final assessment') ? 409 : 500;
    return NextResponse.json({ error: message || 'Failed to submit final assessment' }, { status });
  }
}
