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
exports.metricsOverview = void 0;
const prisma_1 = require("../lib/prisma");
const metricsCache_1 = require("../lib/metricsCache");
const metricsOverview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const days = Number(req.query.days) || 7;
        const tenantId = req.query.tenantId ? String(req.query.tenantId) : undefined;
        const key = `admin:metrics:overview:days=${days}:tenant=${tenantId || "__all"}`;
        const cached = yield (0, metricsCache_1.getCached)(key);
        if (cached) {
            res.json(cached);
            return;
        }
        const since = new Date(Date.now() - days * 86400000);
        const enrollments = yield prisma_1.prisma.enrollment.findMany({ where: { tenantId, enrolledAt: { gte: since } }, include: { course: true } });
        const all = yield prisma_1.prisma.enrollment.findMany({ where: { tenantId } });
        const result = { activeLearners: { value: new Set(enrollments.map((item) => item.userId)).size, change: "—" }, newEnrollments: { value: enrollments.length, change: "—" }, completions: { value: `${all.length ? Math.round(all.filter((item) => item.status === "COMPLETED").length / all.length * 100) : 0}%`, change: "—" }, revenue: { value: `$${enrollments.filter((item) => item.paymentStatus === "PAID").reduce((sum, item) => sum + Number(item.amountPaid || item.course.price), 0).toFixed(2)}`, change: "—" } };
        yield (0, metricsCache_1.setCached)(key, result, 120);
        res.json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to compute metrics" });
    }
});
exports.metricsOverview = metricsOverview;
