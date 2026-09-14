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
exports.authenticateInstructorOrAdmin = exports.authenticateInstructor = exports.authenticateAdmin = exports.authenticateUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const rbac_1 = require("../lib/rbac");
const normalizeRole = (role) => (role || '').toUpperCase();
const authenticateUser = (req, res, next) => {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error("❌ No Bearer token found in request headers");
        res.status(401).json({ error: "Unauthorized - Bearer token is required" });
        return;
    }
    const token = authHeader.split(' ')[1];
    console.log("🔹 Received Token in Backend:", token);
    if (!token) {
        console.error("❌ No token found in request headers");
        res.status(401).json({ error: "Unauthorized - Token is required" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log("✅ Token Verified Successfully:", decoded);
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: "Token expired", expired: true });
            return;
        }
        console.error("❌ User authentication failed:", error);
        res.status(401).json({ error: "Invalid token" });
        return;
    }
};
exports.authenticateUser = authenticateUser;
const authenticateAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const token = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]) || ((_b = req.cookies) === null || _b === void 0 ? void 0 : _b.adminToken);
    if (!token) {
        res.status(401).json({ error: "Admin token required" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const admin = yield prisma_1.prisma.user.findUnique({ where: { id: decoded.id } });
        if (!admin) {
            res.status(403).json({ error: "Invalid admin credentials" });
            return;
        }
        const normalizedTokenRole = normalizeRole(decoded.role);
        const normalizedDbRole = normalizeRole(admin.role);
        const resolvedRole = normalizedTokenRole || normalizedDbRole;
        // Verify admin role (supports both old and new role systems)
        const adminRoles = ['ADMIN', rbac_1.UserRole.SUPER_ADMIN, rbac_1.UserRole.ORG_ADMIN, rbac_1.UserRole.COURSE_ADMIN];
        if (!adminRoles.includes(resolvedRole)) {
            res.status(403).json({ error: "Admin access required" });
            return;
        }
        // Normalize legacy ADMIN to SUPER_ADMIN for RBAC checks downstream
        const effectiveRole = resolvedRole === 'ADMIN' ? rbac_1.UserRole.SUPER_ADMIN : resolvedRole;
        req.user = {
            id: decoded.id,
            email: decoded.email || admin.email,
            role: effectiveRole,
            organizationId: decoded.organizationId,
        };
        next();
    }
    catch (error) {
        console.error("❌ Admin authentication failed:", error);
        res.status(403).json({ error: "Invalid or expired admin token" });
    }
});
exports.authenticateAdmin = authenticateAdmin;
const authenticateInstructor = (req, res, next) => {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "INSTRUCTOR") {
            res.status(403).json({ error: "Instructor access required" });
            return;
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(403).json({ error: "Invalid token" });
        return;
    }
};
exports.authenticateInstructor = authenticateInstructor;
const authenticateInstructorOrAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const headerToken = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    const cookieToken = (_b = req.cookies) === null || _b === void 0 ? void 0 : _b.adminToken;
    const token = headerToken || cookieToken;
    if (!token) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: decoded.id } });
        const role = normalizeRole((user === null || user === void 0 ? void 0 : user.role) || decoded.role);
        if (role !== "INSTRUCTOR" && role !== "ADMIN") {
            res.status(403).json({ error: "Instructor or admin access required" });
            return;
        }
        req.user = { id: decoded.id, role };
        next();
    }
    catch (error) {
        console.error("❌ Instructor/Admin authentication failed:", error);
        res.status(403).json({ error: "Invalid token" });
        return;
    }
});
exports.authenticateInstructorOrAdmin = authenticateInstructorOrAdmin;
