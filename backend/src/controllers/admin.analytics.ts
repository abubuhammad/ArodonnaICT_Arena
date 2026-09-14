import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getCached, setCached } from "../lib/metricsCache";

const enrollmentsFor = (tenantId?: string, since?: Date) => prisma.enrollment.findMany({ where: { tenantId, enrolledAt: since ? { gte: since } : undefined }, include: { course: { select: { title: true } } }, orderBy: { enrolledAt: "asc" } });

export const getAnalyticsData = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 90); const rows = await enrollmentsFor(req.query.tenantId ? String(req.query.tenantId) : undefined, new Date(Date.now() - days * 86400000)); const byDate = new Map<string, number>(); const byCourse = new Map<string, { title: string; total: number; completed: number }>();
    for (const row of rows) { const date = row.enrolledAt.toISOString().slice(0, 10); byDate.set(date, (byDate.get(date) || 0) + 1); const current = byCourse.get(row.courseId) || { title: row.course.title, total: 0, completed: 0 }; current.total++; if (row.status === "COMPLETED") current.completed++; byCourse.set(row.courseId, current); }
    let cumulative = 0; const enrollmentTrend = [...byDate].map(([date, count]) => { cumulative += count; return { date, count, cumulative }; }); const completionRates = [...byCourse].map(([courseId, value]) => ({ courseId, courseName: value.title, totalEnrollments: value.total, completedEnrollments: value.completed, completionRate: value.total ? value.completed / value.total * 100 : 0 })).sort((a, b) => b.completionRate - a.completionRate);
    const all = await prisma.enrollment.findMany({ where: { tenantId: req.query.tenantId ? String(req.query.tenantId) : undefined } }); const totalCompleted = all.filter((row) => row.status === "COMPLETED").length;
    res.json({ enrollmentTrend, completionRates, totalEnrollments: all.length, totalCompleted, overallCompletionRate: all.length ? totalCompleted / all.length * 100 : 0 });
  } catch { res.status(500).json({ error: "Failed to fetch analytics data" }); }
};

export const getFunnelsData = async (req: Request, res: Response): Promise<void> => {
  try { const key = `admin:analytics:funnels:${req.query.days || 30}:${req.query.tenantId || "all"}`; const cached = await getCached(key); if (cached) { res.json(cached); return; } const rows = await enrollmentsFor(req.query.tenantId ? String(req.query.tenantId) : undefined, new Date(Date.now() - (Number(req.query.days) || 30) * 86400000)); const result = { enrolled: rows.length, started: rows.filter((row) => row.progressPercentage > 0).length, paid: rows.filter((row) => ["PAID", "WAIVED"].includes(row.paymentStatus)).length, completed: rows.filter((row) => row.status === "COMPLETED").length }; await setCached(key, result, 120); res.json(result); }
  catch { res.status(500).json({ error: "Failed to fetch funnels data" }); }
};

export const getCohortRetention = async (req: Request, res: Response): Promise<void> => {
  try { const weeks = Math.min(Math.max(Number(req.query.weeks) || 8, 1), 52); const rows = await enrollmentsFor(req.query.tenantId ? String(req.query.tenantId) : undefined, new Date(Date.now() - weeks * 7 * 86400000)); const cohorts = new Map<string, any>(); for (const row of rows) { const start = new Date(row.enrolledAt); start.setDate(start.getDate() - start.getDay()); const key = start.toISOString().slice(0, 10); const cohort = cohorts.get(key) || { cohortStart: key, totalEnrolled: 0, completedWithin1Week: 0, completedWithin2Weeks: 0, completedWithin4Weeks: 0, completedWithin8Weeks: 0 }; cohort.totalEnrolled++; if (row.status === "COMPLETED") { const elapsed = (row.updatedAt.getTime() - row.enrolledAt.getTime()) / 86400000; for (const [limit, field] of [[7, "completedWithin1Week"], [14, "completedWithin2Weeks"], [28, "completedWithin4Weeks"], [56, "completedWithin8Weeks"]] as const) if (elapsed <= limit) cohort[field]++; } cohorts.set(key, cohort); } res.json({ cohorts: [...cohorts.values()].map((cohort) => ({ ...cohort, pctWithin1Week: cohort.totalEnrolled ? cohort.completedWithin1Week / cohort.totalEnrolled * 100 : 0, pctWithin2Weeks: cohort.totalEnrolled ? cohort.completedWithin2Weeks / cohort.totalEnrolled * 100 : 0, pctWithin4Weeks: cohort.totalEnrolled ? cohort.completedWithin4Weeks / cohort.totalEnrolled * 100 : 0, pctWithin8Weeks: cohort.totalEnrolled ? cohort.completedWithin8Weeks / cohort.totalEnrolled * 100 : 0 })) }); }
  catch { res.status(500).json({ error: "Failed to fetch cohort retention data" }); }
};
