import { Request, Response } from 'express';
import { clearCache } from '../lib/metricsCache';

/**
 * POST /api/admin/cache/clear
 * Body: { key?: string }
 * If `key` is provided, clears that cache entry; otherwise clears all.
 */
export const clearMetricsCache = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = (req.body && req.body.key) || (req.query && req.query.key) || undefined;
    if (key) {
      clearCache(String(key));
      res.json({ success: true, cleared: key });
      return;
    }

    clearCache();
    res.json({ success: true, cleared: 'all' });
  } catch (err: any) {
    console.error('Failed to clear cache', err?.message || err);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
};

export default clearMetricsCache;
