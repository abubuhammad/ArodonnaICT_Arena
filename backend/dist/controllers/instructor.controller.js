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
exports.updateInstructorProfile = exports.getInstructorEarnings = exports.getInstructorProfile = exports.getInstructorRequestStatus = exports.getEnrollmentProgress = exports.approveInstructorRequest = exports.requestInstructorRole = exports.getInstructorCourses = exports.getInstructorStats = void 0;
const prisma_1 = require("../lib/prisma");
const getInstructorStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courses = yield prisma_1.prisma.course.findMany({ where: { instructorId: req.params.instructorId }, include: { enrollments: true } });
        const enrollments = courses.flatMap((course) => course.enrollments);
        const completed = enrollments.filter((item) => item.progressPercentage >= 100).length;
        const revenue = enrollments.reduce((sum, item) => sum + Number(item.instructorShareAmount || 0), 0) || courses.reduce((sum, course) => sum + (course.isFree ? 0 : Number(course.price) * course.enrollments.length), 0);
        res.json({ totalStudents: new Set(enrollments.map((item) => item.userId)).size, totalCourses: courses.length, completionRate: enrollments.length ? Math.round(completed / enrollments.length * 100) : 0, activeEnrollments: enrollments.length, averageRating: 0, totalRevenue: revenue });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch instructor statistics" });
    }
});
exports.getInstructorStats = getInstructorStats;
const getInstructorCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courses = yield prisma_1.prisma.course.findMany({ where: { instructorId: req.params.instructorId }, include: { enrollments: true } });
        res.json(courses.map((course) => ({ _id: course.id, title: course.title, enrolledStudents: course.enrollments.map((item) => item.userId), completedStudents: course.enrollments.filter((item) => item.progressPercentage >= 100).map((item) => item.userId), rating: 0, revenue: course.enrollments.reduce((sum, item) => sum + Number(item.instructorShareAmount || 0), 0) || (course.isFree ? 0 : Number(course.price) * course.enrollments.length) })));
    }
    catch (_a) {
        res.status(500).json({ error: "Failed to fetch instructor courses" });
    }
});
exports.getInstructorCourses = getInstructorCourses;
const requestInstructorRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: req.body.userId } });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        if (user.role === "INSTRUCTOR") {
            res.json({ message: "Already an instructor" });
            return;
        }
        yield prisma_1.prisma.user.update({ where: { id: user.id }, data: { role: "PENDING" } });
        res.json({ message: "Instructor request submitted for approval" });
    }
    catch (_a) {
        res.status(500).json({ error: "Failed to request instructor role" });
    }
});
exports.requestInstructorRole = requestInstructorRole;
const approveInstructorRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: req.params.userId } });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        if (user.role !== "PENDING") {
            res.status(400).json({ error: "User has not requested instructor role" });
            return;
        }
        yield prisma_1.prisma.user.update({ where: { id: user.id }, data: { role: "INSTRUCTOR" } });
        res.json({ message: "Instructor role approved successfully" });
    }
    catch (_a) {
        res.status(500).json({ error: "Failed to approve instructor role" });
    }
});
exports.approveInstructorRequest = approveInstructorRequest;
const getEnrollmentProgress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courses = yield prisma_1.prisma.course.findMany({ where: { instructorId: req.params.instructorId }, select: { id: true, title: true } });
        const enrollments = yield prisma_1.prisma.enrollment.findMany({ where: { courseId: { in: courses.map((course) => course.id) } }, include: { user: { select: { name: true, email: true } }, course: { select: { title: true } } }, orderBy: { enrolledAt: "desc" } });
        res.json(enrollments.map((item) => ({ enrollmentId: item.id, user: item.user, course: item.course, enrolledAt: item.enrolledAt, progress: { status: item.progressPercentage >= 100 ? "completed" : item.progressPercentage > 0 ? "in-progress" : "not-started", completedLessons: 0, totalLessons: 0, percentage: item.progressPercentage } })));
    }
    catch (_a) {
        res.status(500).json({ error: "Failed to fetch enrollment progress" });
    }
});
exports.getEnrollmentProgress = getEnrollmentProgress;
const getInstructorRequestStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id } });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({ status: user.role === "INSTRUCTOR" ? "approved" : user.role === "PENDING" ? "pending" : "none" });
    }
    catch (_b) {
        res.status(500).json({ error: "Failed to check instructor status" });
    }
});
exports.getInstructorRequestStatus = getInstructorRequestStatus;
const getInstructorProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, name: true, email: true, role: true, title: true, avatar: true, bio: true, isAvailableForCall: true, expertise: true, socialLinks: true } });
        if (!user) {
            res.status(404).json({ error: "Instructor not found" });
            return;
        }
        res.json(user);
    }
    catch (_a) {
        res.status(500).json({ error: "Failed to fetch instructor profile" });
    }
});
exports.getInstructorProfile = getInstructorProfile;
const getInstructorEarnings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courses = yield prisma_1.prisma.course.findMany({ where: { instructorId: req.params.instructorId }, include: { enrollments: true } });
        const earnings = courses.flatMap((course) => course.enrollments.filter((item) => item.paymentStatus === "PAID").map((item) => ({ courseId: course.id, courseTitle: course.title, amount: Number(item.instructorShareAmount || item.amountPaid || 0), date: item.createdAt })));
        res.json({ total: earnings.reduce((sum, item) => sum + item.amount, 0), earnings });
    }
    catch (_a) {
        res.status(500).json({ error: "Failed to fetch earnings" });
    }
});
exports.getInstructorEarnings = getInstructorEarnings;
const updateInstructorProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield prisma_1.prisma.user.update({ where: { id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id }, data: { name: req.body.name, title: req.body.title, bio: req.body.bio, avatar: req.body.avatar, isAvailableForCall: req.body.isAvailableForCall, expertise: req.body.expertise, socialLinks: req.body.socialLinks } });
        res.json(user);
    }
    catch (_b) {
        res.status(500).json({ error: "Failed to update instructor profile" });
    }
});
exports.updateInstructorProfile = updateInstructorProfile;
