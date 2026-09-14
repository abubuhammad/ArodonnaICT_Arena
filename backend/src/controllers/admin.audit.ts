import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// GET /api/admin/audit-logs?limit=50&page=1
export const listAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const where = {
      resourceId: req.query.resourceId ? String(req.query.resourceId) : undefined,
      actionType: req.query.actionType ? String(req.query.actionType) : undefined,
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ items, total, page, limit });
  } catch (err: any) {
    console.error('Error listing audit logs:', err);
    res.status(500).json({ error: 'Failed to list audit logs' });
  }
};
