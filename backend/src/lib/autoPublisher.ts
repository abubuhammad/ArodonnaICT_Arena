import { prisma } from './prisma';

const MILLIS_IN_24H = 24 * 60 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 10 * 60 * 1000; // check every 10 minutes

export function startAutoPublisher(intervalMs = DEFAULT_INTERVAL_MS) {
  console.log('⏱️ Starting auto-publisher for courses (checks every', intervalMs / 1000, 's)');

  const timer = setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - MILLIS_IN_24H);
      // Find courses that are in REVIEW and requested more than 24 hours ago
      const candidates = await prisma.course.findMany({ where: { status: 'REVIEW', reviewRequestedAt: { lte: cutoff } } });
      if (!candidates.length) return;

      console.log(`🔔 Auto-publisher found ${candidates.length} course(s) to publish`);

      for (const c of candidates) {
        try {
          const updated = await prisma.course.update({ where: { id: c.id }, data: { status: 'PUBLISHED', publishAt: c.publishAt || new Date(), reviewRequestedAt: null } });

          try {
            await prisma.auditLog.create({ data: {
              actorId: 'system',
              actorRole: 'SYSTEM',
              actionType: 'COURSE_AUTO_PUBLISH',
              resourceType: 'Course',
              resourceId: c.id,
              details: { reason: 'Auto-published after 24h in REVIEW' },
              ipAddress: null,
            } });
          } catch (logErr) {
            console.warn('Failed to write audit log for auto-publish:', (logErr as any)?.message || logErr);
          }

          console.log('✅ Auto-published course', updated.id, updated.title || '');
        } catch (err) {
          console.error('Failed to auto-publish course', c.id, err);
        }
      }
    } catch (err) {
      console.error('Auto-publisher error:', err);
    }
  }, intervalMs);

  // return a stop function
  return () => clearInterval(timer);
}
