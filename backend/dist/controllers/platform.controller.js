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
exports.updatePlatformSettings = exports.getPlatformSettings = void 0;
const prisma_1 = require("../lib/prisma");
const getPlatformSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🔹 getPlatformSettings called, headers:', req.headers && Object.keys(req.headers).length ? { auth: req.headers.authorization } : {});
        const setting = yield prisma_1.prisma.platformSetting.findFirst({ orderBy: { createdAt: 'asc' } });
        res.json(setting || { platformSharePercent: 20 });
    }
    catch (err) {
        console.error('Failed to fetch platform settings', (err === null || err === void 0 ? void 0 : err.stack) || err);
        // In dev show stack trace to help debugging
        res.status(500).json({ error: 'Failed to fetch settings', details: (err === null || err === void 0 ? void 0 : err.message) || String(err) });
    }
});
exports.getPlatformSettings = getPlatformSettings;
const updatePlatformSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { platformSharePercent } = req.body;
        if (typeof platformSharePercent !== 'number' || platformSharePercent < 0 || platformSharePercent > 100) {
            res.status(400).json({ error: 'Invalid platformSharePercent' });
            return;
        }
        let setting = yield prisma_1.prisma.platformSetting.findFirst({ orderBy: { createdAt: 'asc' } });
        if (!setting) {
            setting = yield prisma_1.prisma.platformSetting.create({ data: { platformSharePercent } });
        }
        else {
            setting = yield prisma_1.prisma.platformSetting.update({ where: { id: setting.id }, data: { platformSharePercent } });
        }
        res.json({ message: 'Settings updated', setting });
    }
    catch (err) {
        console.error('Failed to update platform settings', err);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});
exports.updatePlatformSettings = updatePlatformSettings;
