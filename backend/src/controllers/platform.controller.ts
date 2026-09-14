import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth';

export const getPlatformSettings = async (req: Request, res: Response) => {
  try {
    console.log('🔹 getPlatformSettings called, headers:', req.headers && Object.keys(req.headers).length ? { auth: req.headers.authorization } : {});
    const setting = await prisma.platformSetting.findFirst({ orderBy: { createdAt: 'asc' } });
    res.json(setting || { platformSharePercent: 20 });
  } catch (err) {
    console.error('Failed to fetch platform settings', (err as any)?.stack || err);
    // In dev show stack trace to help debugging
    res.status(500).json({ error: 'Failed to fetch settings', details: (err as any)?.message || String(err) });
  }
};

export const updatePlatformSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { platformSharePercent } = req.body as { platformSharePercent?: number };
    if (typeof platformSharePercent !== 'number' || platformSharePercent < 0 || platformSharePercent > 100) {
      res.status(400).json({ error: 'Invalid platformSharePercent' });
      return;
    }

    let setting = await prisma.platformSetting.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!setting) {
      setting = await prisma.platformSetting.create({ data: { platformSharePercent } });
    } else {
      setting = await prisma.platformSetting.update({ where: { id: setting.id }, data: { platformSharePercent } });
    }

    res.json({ message: 'Settings updated', setting });
  } catch (err) {
    console.error('Failed to update platform settings', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
