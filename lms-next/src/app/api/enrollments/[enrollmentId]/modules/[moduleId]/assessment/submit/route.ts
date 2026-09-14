import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { submitModuleAssessment } from '@/lib/courseProgress';

export async function POST(request: NextRequest, { params }: { params: Promise<{ enrollmentId: string; moduleId: string }> }) {
  try {
    const user = authenticateUser(request.headers);
    const { enrollmentId, moduleId } = await params;
    const body = await request.json();
    const result = await submitModuleAssessment(enrollmentId, user.id, moduleId, body.answers || []);
    return NextResponse.json({ message: result.passed ? 'Module assessment passed' : 'Module assessment not passed', result });
  } catch (error) {
    if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    const message = error instanceof Error ? error.message : '';
    const status = message.includes('not found') ? 404 : message.includes('Invalid enrollment') ? 403 : message.includes('must be passed') || message.includes('no assessment') ? 409 : 500;
    return NextResponse.json({ error: message || 'Failed to submit module assessment' }, { status });
  }
}
