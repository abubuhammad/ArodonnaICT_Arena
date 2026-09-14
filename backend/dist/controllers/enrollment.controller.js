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
exports.getEnrollmentProgress = exports.verifyPayment = exports.getUserEnrollments = exports.createEnrollment = void 0;
const courseProgressService_1 = require("../services/courseProgressService");
const axios_1 = __importDefault(require("axios"));
const prisma_1 = require("../lib/prisma");
const courseInclude = { course: { include: { instructor: { select: { name: true } }, category: true } } };
const createEnrollment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized - Please log in" });
            return;
        }
        const { courseId, paymentMethod, paymentReference } = req.body;
        const course = yield prisma_1.prisma.course.findUnique({ where: { id: courseId } });
        if (!course) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        const existing = yield prisma_1.prisma.enrollment.findUnique({ where: { userId_courseId: { userId: req.user.id, courseId } } });
        if (existing) {
            res.status(409).json({ error: "You are already enrolled in this course", enrollment: existing });
            return;
        }
        if (course.isFree) {
            const enrollment = yield prisma_1.prisma.enrollment.create({ data: { userId: req.user.id, courseId, paymentStatus: "WAIVED" } });
            res.status(201).json({ message: "Enrollment successful", enrollment });
            return;
        }
        if (!paymentMethod || !paymentReference) {
            res.status(400).json({ error: "Payment method and reference are required" });
            return;
        }
        if (paymentMethod === "PAYSTACK") {
            const secret = process.env.PAYSTACK_SECRET;
            if (!secret) {
                res.status(500).json({ error: "PAYSTACK_SECRET is not configured" });
                return;
            }
            const result = yield axios_1.default.get(`https://api.paystack.co/transaction/verify/${paymentReference}`, { headers: { Authorization: `Bearer ${secret}` } });
            if (((_b = (_a = result.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.status) !== "success") {
                res.status(400).json({ error: "Payment verification failed" });
                return;
            }
        }
        const enrollment = yield prisma_1.prisma.enrollment.create({ data: { userId: req.user.id, courseId, paymentMethod: String(paymentMethod).toUpperCase(), paymentReference, paymentStatus: paymentMethod === "BANK_TRANSFER" ? "PENDING" : "PAID" } });
        res.status(201).json({ message: paymentMethod === "BANK_TRANSFER" ? "Transfer reference received; awaiting verification" : "Payment verified and enrollment successful", enrollment });
    }
    catch (error) {
        console.error("Enrollment error:", error);
        res.status(500).json({ error: "Failed to create enrollment" });
    }
});
exports.createEnrollment = createEnrollment;
const getUserEnrollments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const enrollments = yield prisma_1.prisma.enrollment.findMany({ where: { userId: req.user.id }, include: courseInclude, orderBy: { createdAt: "desc" } });
        res.json(enrollments.map((enrollment) => ({ _id: enrollment.id, userId: enrollment.userId, courseId: enrollment.course ? { _id: enrollment.course.id, title: enrollment.course.title } : undefined, status: enrollment.status, paymentStatus: enrollment.paymentStatus, paymentMethod: enrollment.paymentMethod || undefined, paymentReference: enrollment.paymentReference || undefined, createdAt: enrollment.createdAt, progressPercentage: enrollment.progressPercentage })));
    }
    catch (error) {
        console.error("Error fetching enrollments:", error);
        res.status(500).json({ error: "Error fetching enrollments" });
    }
});
exports.getUserEnrollments = getUserEnrollments;
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || String(req.user.role).toUpperCase() !== "ADMIN") {
            res.status(403).json({ error: "Unauthorized - Admin access required" });
            return;
        }
        const { verified } = req.body;
        const enrollment = yield prisma_1.prisma.enrollment.update({ where: { id: req.params.enrollmentId || req.params.id }, data: { paymentStatus: verified ? "PAID" : "NOT_PAID", status: verified ? "ENROLLED" : undefined } });
        res.json({ message: `Payment ${verified ? "verified" : "rejected"} successfully`, enrollment });
    }
    catch (_a) {
        res.status(404).json({ error: "Enrollment not found" });
    }
});
exports.verifyPayment = verifyPayment;
// NOTE: The old client-trusted progress endpoints (updateEnrollmentProgress,
// updateModuleProgress, updateFinalAssessment, updateProgress) were removed.
// They accepted progress/scores/pass-fail flags straight from the request body
// with no server-side verification, letting any authenticated user fake
// completion, module passes, or a certificate. All progress mutations now go
// through backend/src/services/courseProgressService.ts, which grades every
// quiz/assessment against the stored answer key and enforces lesson/module
// locks. See: startCourseHandler, viewLessonHandler, completeLessonNoQuizHandler,
// submitQuizHandler, submitModuleAssessmentHandler, submitFinalAssessmentHandler
// in courseProgress.controller.ts.
const getEnrollmentProgress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const enrollment = yield prisma_1.prisma.enrollment.findFirst({ where: { id: req.params.enrollmentId, userId: req.user.id }, include: { course: { include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } } } }, courseProgress: true } });
        if (!enrollment) {
            res.status(404).json({ error: "Enrollment not found or not owned by user" });
            return;
        }
        if (!enrollment.courseProgress) {
            yield (0, courseProgressService_1.startCourse)(enrollment.id, req.user.id);
        }
        const state = yield (0, courseProgressService_1.ensureProgress)(enrollment.id, req.user.id);
        res.json({ enrollmentId: enrollment.id, status: enrollment.status, progressPercentage: enrollment.progressPercentage, modules: state.modules });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch enrollment progress" });
    }
});
exports.getEnrollmentProgress = getEnrollmentProgress;
