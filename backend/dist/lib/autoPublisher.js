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
exports.startAutoPublisher = startAutoPublisher;
const prisma_1 = require("./prisma");
const MILLIS_IN_24H = 24 * 60 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 10 * 60 * 1000; // check every 10 minutes
function startAutoPublisher(intervalMs = DEFAULT_INTERVAL_MS) {
    console.log('⏱️ Starting auto-publisher for courses (checks every', intervalMs / 1000, 's)');
    const timer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
        try {
            const cutoff = new Date(Date.now() - MILLIS_IN_24H);
            // Find courses that are in REVIEW and requested more than 24 hours ago
            const candidates = yield prisma_1.prisma.course.findMany({ where: { status: 'REVIEW', reviewRequestedAt: { lte: cutoff } } });
            if (!candidates.length)
                return;
            console.log(`🔔 Auto-publisher found ${candidates.length} course(s) to publish`);
            for (const c of candidates) {
                try {
                    const updated = yield prisma_1.prisma.course.update({ where: { id: c.id }, data: { status: 'PUBLISHED', publishAt: c.publishAt || new Date(), reviewRequestedAt: null } });
                    try {
                        yield prisma_1.prisma.auditLog.create({ data: {
                                actorId: 'system',
                                actorRole: 'SYSTEM',
                                actionType: 'COURSE_AUTO_PUBLISH',
                                resourceType: 'Course',
                                resourceId: c.id,
                                details: { reason: 'Auto-published after 24h in REVIEW' },
                                ipAddress: null,
                            } });
                    }
                    catch (logErr) {
                        console.warn('Failed to write audit log for auto-publish:', (logErr === null || logErr === void 0 ? void 0 : logErr.message) || logErr);
                    }
                    console.log('✅ Auto-published course', updated.id, updated.title || '');
                }
                catch (err) {
                    console.error('Failed to auto-publish course', c.id, err);
                }
            }
        }
        catch (err) {
            console.error('Auto-publisher error:', err);
        }
    }), intervalMs);
    // return a stop function
    return () => clearInterval(timer);
}
