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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenIfNeeded = exports.verifyInstructor = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
// No-op placeholder to keep the middleware edit scoped
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Add user to request object
        req.user = { id: user.id, role: user.role };
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired', expired: true });
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
});
exports.verifyToken = verifyToken;
const verifyInstructor = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role !== 'INSTRUCTOR') {
            return res.status(403).json({ message: 'Access denied. Instructor role required.' });
        }
        // Check if token is about to expire (less than 1 hour remaining)
        const timeToExpire = (decoded.exp || 0) - Math.floor(Date.now() / 1000);
        if (timeToExpire < 3600) {
            // Generate new token
            const newToken = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
            // Add new token to response headers
            res.setHeader('X-New-Token', newToken);
        }
        // Add user to request object
        req.user = { id: user.id, role: user.role };
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Instructor session expired. Please log in again.',
                expired: true
            });
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
});
exports.verifyInstructor = verifyInstructor;
// Middleware to refresh token if it's about to expire
const refreshTokenIfNeeded = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return next();
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Check if token is about to expire (less than 1 hour remaining)
        const timeToExpire = (decoded.exp || 0) - Math.floor(Date.now() / 1000);
        if (timeToExpire < 3600) {
            const user = yield prisma_1.prisma.user.findUnique({ where: { id: decoded.id } });
            if (user) {
                const newToken = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
                res.setHeader('X-New-Token', newToken);
            }
        }
        next();
    }
    catch (error) {
        // If there's an error, just continue without refreshing
        next();
    }
});
exports.refreshTokenIfNeeded = refreshTokenIfNeeded;
