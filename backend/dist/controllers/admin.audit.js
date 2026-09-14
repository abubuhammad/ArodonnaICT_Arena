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
exports.listAuditLogs = void 0;
const prisma_1 = require("../lib/prisma");
// GET /api/admin/audit-logs?limit=50&page=1
const listAuditLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = Math.min(Number(req.query.limit) || 50, 200);
        const page = Math.max(Number(req.query.page) || 1, 1);
        const skip = (page - 1) * limit;
        const where = {
            resourceId: req.query.resourceId ? String(req.query.resourceId) : undefined,
            actionType: req.query.actionType ? String(req.query.actionType) : undefined,
        };
        const [items, total] = yield Promise.all([
            prisma_1.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
            prisma_1.prisma.auditLog.count({ where }),
        ]);
        res.json({ items, total, page, limit });
    }
    catch (err) {
        console.error('Error listing audit logs:', err);
        res.status(500).json({ error: 'Failed to list audit logs' });
    }
});
exports.listAuditLogs = listAuditLogs;
