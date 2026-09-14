import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { certificatePdfBuffer } from '@/lib/certificatePdf';

export async function GET(request: NextRequest, { params }: { params: Promise<{ certificateId: string }> }) {
  try {
    const { certificateId } = await params;
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: { enrollment: { include: { user: true, course: { include: { instructor: true } } } } },
    });

    if (!certificate || certificate.revoked) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    const metadata = certificate.metadata && typeof certificate.metadata === 'object' ? certificate.metadata as any : {};
    const buffer = await certificatePdfBuffer({
      learnerName: certificate.enrollment.user.name,
      courseTitle: certificate.enrollment.course.title,
      instructorName: certificate.enrollment.course.instructor.name,
      serial: certificate.serial,
      issuedAt: certificate.issuedAt,
      template: metadata.template || certificate.enrollment.course.instructor.certificateTemplate as any,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.serial}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Failed to download certificate', error);
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 });
  }
}
