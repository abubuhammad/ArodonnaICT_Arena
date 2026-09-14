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
exports.clearMetricsCache = void 0;
const metricsCache_1 = require("../lib/metricsCache");
/**
 * POST /api/admin/cache/clear
 * Body: { key?: string }
 * If `key` is provided, clears that cache entry; otherwise clears all.
 */
const clearMetricsCache = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const key = (req.body && req.body.key) || (req.query && req.query.key) || undefined;
        if (key) {
            (0, metricsCache_1.clearCache)(String(key));
            res.json({ success: true, cleared: key });
            return;
        }
        (0, metricsCache_1.clearCache)();
        res.json({ success: true, cleared: 'all' });
    }
    catch (err) {
        console.error('Failed to clear cache', (err === null || err === void 0 ? void 0 : err.message) || err);
        res.status(500).json({ error: 'Failed to clear cache' });
    }
});
exports.clearMetricsCache = clearMetricsCache;
exports.default = exports.clearMetricsCache;
