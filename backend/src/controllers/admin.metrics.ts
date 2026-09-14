import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getCached, setCached } from "../lib/metricsCache";

export const metricsOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = Number(req.query.days) || 7; const tenantId = req.query.tenantId ? String(req.query.tenantId) : undefined; const key = `admin:metrics:overview:days=${days}:tenant=${tenantId || "__all"}`;
    const cached = await getCached(key); if (cached) { res.json(cached); return; }
    const since = new Date(Date.now() - days * 86400000); const enrollments = await prisma.enrollment.findMany({ where: { tenantId, enrolledAt: { gte: since } }, include: { course: true } }); const all = await prisma.enrollment.findMany({ where: { tenantId } });
    const result = { activeLearners: { value: new Set(enrollments.map((item) => item.userId)).size, change: "—" }, newEnrollments: { value: enrollments.length, change: "—" }, completions: { value: `${all.length ? Math.round(all.filter((item) => item.status === "COMPLETED").length / all.length * 100) : 0}%`, change: "—" }, revenue: { value: `$${enrollments.filter((item) => item.paymentStatus === "PAID").reduce((sum, item) => sum + Number(item.amountPaid || item.course.price), 0).toFixed(2)}`, change: "—" } };
    await setCached(key, result, 120); res.json(result);
  } catch (error) { console.error(error); res.status(500).json({ error: "Failed to compute metrics" }); }
};
