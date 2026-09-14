"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCohortRetention = exports.getFunnelsData = exports.getAnalyticsData = void 0;
const prisma_1 = require("../lib/prisma");
const metricsCache_1 = require("../lib/metricsCache");
const enrollmentsFor = (tenantId, since) => prisma_1.prisma.enrollment.findMany({ where: { tenantId, enrolledAt: since ? { gte: since } : undefined }, include: { course: { select: { title: true } } }, orderBy: { enrolledAt: "asc" } });
const getAnalyticsData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 90);
        const rows = yield enrollmentsFor(req.query.tenantId ? String(req.query.tenantId) : undefined, new Date(Date.now() - days * 86400000));
        const byDate = new Map();
        const byCourse = new Map();
        for (const row of rows) {
            const date = row.enrolledAt.toISOString().slice(0, 10);
            byDate.set(date, (byDate.get(date) || 0) + 1);
            const current = byCourse.get(row.courseId) || { title: row.course.title, total: 0, completed: 0 };
            current.total++;
            if (row.status === "COMPLETED")
                current.completed++;
            byCourse.set(row.courseId, current);
        }
        let cumulative = 0;
        const enrollmentTrend = [...byDate].map(([date, count]) => { cumulative += count; return { date, count, cumulative }; });
        const completionRates = [...byCourse].map(([courseId, value]) => ({ courseId, courseName: value.title, totalEnrollments: value.total, completedEnrollments: value.completed, completionRate: value.total ? value.completed / value.total * 100 : 0 })).sort((a, b) => b.completionRate - a.completionRate);
        const all = yield prisma_1.prisma.enrollment.findMany({ where: { tenantId: req.query.tenantId ? String(req.query.tenantId) : undefined } });
        const totalCompleted = all.filter((row) => row.status === "COMPLETED").length;
        res.json({ enrollmentTrend, completionRates, totalEnrollments: all.length, totalCompleted, overallCompletionRate: all.length ? totalCompleted / all.length * 100 : 0 });
    }
    catch (_a) {
        res.status(500).json({ error: "Failed to fetch analytics data" });
    }
});
exports.getAnalyticsData = getAnalyticsData;
const getFunnelsData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const key = `admin:analytics:funnels:${req.query.days || 30}:${req.query.tenantId || "all"}`;
        const cached = yield (0, metricsCache_1.getCached)(key);
        if (cached) {
            res.json(cached);
            return;
        }
        const rows = yield enrollmentsFor(req.query.tenantId ? String(req.query.tenantId) : undefined, new Date(Date.now() - (Number(req.query.days) || 30) * 86400000));
        const result = { enrolled: rows.length, started: rows.filter((row) => row.progressPercentage > 0).length, paid: rows.filter((row) => ["PAID", "WAIVED"].includes(row.paymentStatus)).length, completed: rows.filter((row) => row.status === "COMPLETED").length };
        yield (0, metricsCache_1.setCached)(key, result, 120);
        res.json(result);
    }
    catch (_a) {
        res.status(500).json({ error: "Failed to fetch funnels data" });
    }
});
exports.getFunnelsData = getFunnelsData;
const getCohortRetention = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const weeks = Math.min(Math.max(Number(req.query.weeks) || 8, 1), 52);
        const rows = yield enrollmentsFor(req.query.tenantId ? String(req.query.tenantId) : undefined, new Date(Date.now() - weeks * 7 * 86400000));
        const cohorts = new Map();
        for (const row of rows) {
            const start = new Date(row.enrolledAt);
            start.setDate(start.getDate() - start.getDay());
            const key = start.toISOString().slice(0, 10);
            const cohort = cohorts.get(key) || { cohortStart: key, totalEnrolled: 0, completedWithin1Week: 0, completedWithin2Weeks: 0, completedWithin4Weeks: 0, completedWithin8Weeks: 0 };
            cohort.totalEnrolled++;
            if (row.status === "COMPLETED") {
                const elapsed = (row.updatedAt.getTime() - row.enrolledAt.getTime()) / 86400000;
                for (const [limit, field] of [[7, "completedWithin1Week"], [14, "completedWithin2Weeks"], [28, "completedWithin4Weeks"], [56, "completedWithin8Weeks"]])
                    if (elapsed <= limit)
                        cohort[field]++;
            }
            cohorts.set(key, cohort);
        }
        res.json({ cohorts: [...cohorts.values()].map((cohort) => (Object.assign(Object.assign({}, cohort), { pctWithin1Week: cohort.totalEnrolled ? cohort.completedWithin1Week / cohort.totalEnrolled * 100 : 0, pctWithin2Weeks: cohort.totalEnrolled ? cohort.completedWithin2Weeks / cohort.totalEnrolled * 100 : 0, pctWithin4Weeks: cohort.totalEnrolled ? cohort.completedWithin4Weeks / cohort.totalEnrolled * 100 : 0, pctWithin8Weeks: cohort.totalEnrolled ? cohort.completedWithin8Weeks / cohort.totalEnrolled * 100 : 0 }))) });
    }
    catch (_a) {
        res.status(500).json({ error: "Failed to fetch cohort retention data" });
    }
});
exports.getCohortRetention = getCohortRetention;
