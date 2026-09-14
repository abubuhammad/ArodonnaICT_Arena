import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = authenticateUser(request.headers);
    const certificates = await prisma.certificate.findMany({
      where: { enrollment: { userId: user.id } },
      include: {
        enrollment: {
          include: {
            course: { include: { instructor: { select: { name: true } } } },
          },
        },
      },
    });

    return NextResponse.json(
      certificates.map((certificate) => ({
        id: certificate.id,
        courseId: certificate.enrollment.courseId,
        courseName: certificate.enrollment.course.title,
        userId: user.id,
        instructorName: certificate.enrollment.course.instructor.name,
        issueDate: certificate.issuedAt,
        grade: 'A',
        certificationUrl: `${process.env.CERTIFICATE_BASE_URL || 'http://localhost:5000/api/certificates'}/${certificate.id}/download`,
      }))
    );
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}
