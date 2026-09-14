import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MILLIS_IN_24H = 24 * 60 * 60 * 1000;

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  return Boolean(secret && authorization === `Bearer ${secret}`);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - MILLIS_IN_24H);
    const candidates = await prisma.course.findMany({
      where: { status: 'REVIEW', reviewRequestedAt: { lte: cutoff } },
    });

    let published = 0;
    const errors: Array<{ courseId: string; error: string }> = [];

    for (const course of candidates) {
      try {
        const updated = await prisma.course.update({
          where: { id: course.id },
          data: {
            status: 'PUBLISHED',
            publishAt: course.publishAt || new Date(),
            reviewRequestedAt: null,
          },
        });

        try {
          await prisma.auditLog.create({
            data: {
              actorId: 'system',
              actorRole: 'SYSTEM',
              actionType: 'COURSE_AUTO_PUBLISH',
              resourceType: 'Course',
              resourceId: course.id,
              details: { reason: 'Auto-published after 24h in REVIEW' },
              ipAddress: null,
            },
          });
        } catch (auditError) {
          console.warn('Failed to write audit log for auto-publish:', auditError);
        }

        published += 1;
        console.log('Auto-published course', updated.id, updated.title || '');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ courseId: course.id, error: message });
        console.error('Failed to auto-publish course', course.id, error);
      }
    }

    return NextResponse.json({ found: candidates.length, published, errors });
  } catch (error) {
    console.error('Auto-publisher error:', error);
    return NextResponse.json({ error: 'Auto-publisher error' }, { status: 500 });
  }
}
