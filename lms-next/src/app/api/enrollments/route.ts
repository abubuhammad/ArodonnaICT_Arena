import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const errorResponse = (error: unknown, fallback: string) => {
  if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
};

export async function POST(request: NextRequest) {
  try {
    const user = authenticateUser(request.headers);
    const { courseId, paymentMethod, paymentReference } = await request.json();
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } });
    if (existing) return NextResponse.json({ error: 'You are already enrolled in this course', enrollment: existing }, { status: 409 });
    if (course.isFree) {
      const enrollment = await prisma.enrollment.create({ data: { userId: user.id, courseId, paymentStatus: 'WAIVED' } });
      return NextResponse.json({ message: 'Enrollment successful', enrollment }, { status: 201 });
    }
    if (!paymentMethod || !paymentReference) return NextResponse.json({ error: 'Payment method and reference are required' }, { status: 400 });
    if (paymentMethod === 'PAYSTACK') {
      if (!process.env.PAYSTACK_SECRET) return NextResponse.json({ error: 'PAYSTACK_SECRET is not configured' }, { status: 500 });
      const result = await fetch(`https://api.paystack.co/transaction/verify/${paymentReference}`, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` } });
      const payload = await result.json();
      if (payload?.data?.status !== 'success') return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }
    const enrollment = await prisma.enrollment.create({ data: { userId: user.id, courseId, paymentMethod: String(paymentMethod).toUpperCase() as any, paymentReference, paymentStatus: paymentMethod === 'BANK_TRANSFER' ? 'PENDING' : 'PAID' } });
    return NextResponse.json({ message: paymentMethod === 'BANK_TRANSFER' ? 'Transfer reference received; awaiting verification' : 'Payment verified and enrollment successful', enrollment }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create enrollment');
  }
}
