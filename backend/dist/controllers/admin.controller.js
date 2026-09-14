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
exports.deleteUser = exports.approveInstructor = exports.verifyEnrollmentPayment = exports.adminGrantFreeEnrollment = exports.grantFreeEnrollment = exports.deleteEnrollment = exports.getEnrollments = exports.getUsers = exports.adminLogin = exports.registerAdmin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const registerAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (yield prisma_1.prisma.user.count({ where: { role: "ADMIN" } })) {
            if (!process.env.ADMIN_SETUP_TOKEN || req.headers["x-setup-token"] !== process.env.ADMIN_SETUP_TOKEN) {
                res.status(403).json({ error: "Admin creation locked. Provide valid X-Setup-Token." });
                return;
            }
        }
        const existing = yield prisma_1.prisma.user.findUnique({ where: { email: req.body.email } });
        if (existing) {
            res.status(400).json({ error: "Admin already exists" });
            return;
        }
        yield prisma_1.prisma.user.create({ data: { name: req.body.name, email: req.body.email, password: yield bcryptjs_1.default.hash(req.body.password, 10), role: "ADMIN" } });
        res.status(201).json({ message: "Admin created successfully" });
    }
    catch (_a) {
        res.status(500).json({ error: "Failed to create admin" });
    }
});
exports.registerAdmin = registerAdmin;
const adminLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
        const password = typeof req.body.password === "string" ? req.body.password : "";
        if (!email || !password) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        const admin = yield prisma_1.prisma.user.findFirst({ where: { email, role: "ADMIN" } });
        if (!admin || !(yield bcryptjs_1.default.compare(password, admin.password))) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        if (!process.env.JWT_SECRET) {
            console.error("Admin login failed: JWT_SECRET is not configured");
            res.status(500).json({ error: "Server configuration error" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: admin.id, role: "ADMIN" }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.json({
            message: "Admin login successful",
            token,
            admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }
        });
    }
    catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.adminLogin = adminLogin;
const getUsers = (_req, res) => __awaiter(void 0, void 0, void 0, function* () { try {
    res.json(yield prisma_1.prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true, title: true, avatar: true, bio: true, isAvailableForCall: true, expertise: true, socialLinks: true, createdAt: true } }));
}
catch (_a) {
    res.status(500).json({ error: "Error fetching users" });
} });
exports.getUsers = getUsers;
const getEnrollments = (_req, res) => __awaiter(void 0, void 0, void 0, function* () { try {
    const items = yield prisma_1.prisma.enrollment.findMany({ orderBy: { createdAt: "desc" }, include: { course: { select: { id: true, title: true } }, user: { select: { id: true, name: true, email: true } } } });
    res.json(items.map((item) => ({ id: item.id, status: item.status, paymentStatus: item.paymentStatus, paymentMethod: item.paymentMethod, paymentReference: item.paymentReference, progressPercentage: item.progressPercentage, enrolledAt: item.enrolledAt, createdAt: item.createdAt, course: item.course, user: item.user })));
}
catch (_a) {
    res.status(500).json({ error: "Error fetching enrollments" });
} });
exports.getEnrollments = getEnrollments;
const deleteEnrollment = (req, res) => __awaiter(void 0, void 0, void 0, function* () { try {
    yield prisma_1.prisma.enrollment.delete({ where: { id: req.params.id } });
    res.json({ message: "Enrollment deleted successfully" });
}
catch (_a) {
    res.status(404).json({ error: "Enrollment not found" });
} });
exports.deleteEnrollment = deleteEnrollment;
const grantFreeEnrollment = (req, res) => __awaiter(void 0, void 0, void 0, function* () { try {
    const updated = yield prisma_1.prisma.enrollment.update({ where: { id: req.params.id }, data: { paymentStatus: "WAIVED" } });
    res.json(updated);
}
catch (_a) {
    res.status(404).json({ error: "Enrollment not found" });
} });
exports.grantFreeEnrollment = grantFreeEnrollment;
const adminGrantFreeEnrollment = (req, res) => __awaiter(void 0, void 0, void 0, function* () { try {
    const enrollment = yield prisma_1.prisma.enrollment.upsert({ where: { userId_courseId: { userId: req.body.userId, courseId: req.body.courseId } }, update: { paymentStatus: "WAIVED", status: "ENROLLED" }, create: { userId: req.body.userId, courseId: req.body.courseId, paymentStatus: "WAIVED" } });
    res.status(201).json({ message: "Free enrollment granted", enrollment });
}
catch (_a) {
    res.status(500).json({ error: "Failed to grant free enrollment" });
} });
exports.adminGrantFreeEnrollment = adminGrantFreeEnrollment;
const verifyEnrollmentPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () { try {
    const updated = yield prisma_1.prisma.enrollment.update({ where: { id: req.params.id }, data: { paymentStatus: req.body.verified ? "PAID" : "NOT_PAID", status: "ENROLLED" } });
    res.json({ message: "Payment status updated", enrollment: updated });
}
catch (_a) {
    res.status(404).json({ error: "Enrollment not found" });
} });
exports.verifyEnrollmentPayment = verifyEnrollmentPayment;
const approveInstructor = (req, res) => __awaiter(void 0, void 0, void 0, function* () { try {
    const user = yield prisma_1.prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    if (user.role !== "PENDING") {
        res.status(400).json({ error: "User is not pending instructor approval" });
        return;
    }
    const updated = yield prisma_1.prisma.user.update({ where: { id: user.id }, data: { role: "INSTRUCTOR" } });
    res.json({ message: "Instructor approved successfully", user: updated });
}
catch (_a) {
    res.status(500).json({ error: "Failed to approve instructor" });
} });
exports.approveInstructor = approveInstructor;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () { var _a, _b; try {
    const user = yield prisma_1.prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    yield prisma_1.prisma.user.delete({ where: { id: user.id } });
    yield prisma_1.prisma.auditLog.create({ data: { actorId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, actorRole: (_b = req.user) === null || _b === void 0 ? void 0 : _b.role, actionType: "DELETE_USER", resourceType: "User", resourceId: user.id, details: { email: user.email, name: user.name }, ipAddress: req.ip } });
    res.json({ message: "User deleted successfully" });
}
catch (_c) {
    res.status(500).json({ error: "Failed to delete user" });
} });
exports.deleteUser = deleteUser;
