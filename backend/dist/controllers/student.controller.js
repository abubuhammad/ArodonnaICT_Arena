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
exports.updateStudentProfile = exports.getStudentProgress = exports.getCertificates = exports.getEnrolledCourses = exports.getStudentStats = void 0;
const prisma_1 = require("../lib/prisma");
const getStudentStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // NOTE: previously trusted req.params.userId with no ownership check,
        // letting any authenticated user read another user's stats by URL. Also,
        // the /certificates route below never had a :userId param in the first
        // place, so req.params.userId was always undefined there — which Prisma
        // silently treats as "no filter", returning every certificate for every
        // user. Both now use the authenticated caller's own id.
        if (req.params.userId && ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) && req.params.userId !== req.user.id) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        const userId = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || req.params.userId;
        const enrollments = yield prisma_1.prisma.enrollment.findMany({ where: { userId } });
        const completed = enrollments.filter((item) => item.progressPercentage >= 100 || item.status === "COMPLETED").length;
        const average = enrollments.length ? enrollments.reduce((sum, item) => sum + item.progressPercentage, 0) / enrollments.length : 0;
        res.json({ totalEnrolled: enrollments.length, coursesCompleted: completed, certificatesEarned: completed, averageProgress: Math.round(average), totalHoursLearned: enrollments.length * 10, achievements: enrollments.length });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch student stats" });
    }
});
exports.getStudentStats = getStudentStats;
const getEnrolledCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(400).json({ error: "User ID is required." });
        const enrollments = yield prisma_1.prisma.enrollment.findMany({ where: { userId }, orderBy: { enrolledAt: "desc" }, include: { course: { include: { instructor: { select: { name: true } }, category: true } } } });
        res.json(enrollments.map((item) => ({ id: item.course.id, _id: item.course.id, title: item.course.title, description: item.course.description, instructor: item.course.instructor.name, thumbnail: item.course.thumbnail || "/images/course-default.jpg", price: item.course.price, isFree: item.course.isFree, level: item.course.level || "Beginner", duration: item.course.duration || "0 hours", category: item.course.category.name, enrollmentStatus: item.status, progress: item.progressPercentage, lastAccessed: item.updatedAt })));
    }
    catch (_b) {
        res.status(500).json({ error: "Failed to fetch enrolled courses" });
    }
});
exports.getEnrolledCourses = getEnrolledCourses;
const getCertificates = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const certificates = yield prisma_1.prisma.certificate.findMany({ where: { enrollment: { userId } }, include: { enrollment: { include: { course: { include: { instructor: { select: { name: true } } } } } } } });
        res.json(certificates.map((certificate) => ({ id: certificate.id, courseId: certificate.enrollment.courseId, courseName: certificate.enrollment.course.title, userId, instructorName: certificate.enrollment.course.instructor.name, issueDate: certificate.issuedAt, grade: "A", certificationUrl: certificate.fileUrl })));
    }
    catch (_b) {
        res.status(500).json({ error: "Failed to fetch certificates" });
    }
});
exports.getCertificates = getCertificates;
const getStudentProgress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const enrollment = yield prisma_1.prisma.enrollment.findUnique({ where: { userId_courseId: { userId: req.params.userId, courseId: req.params.courseId } } });
        if (!enrollment) {
            res.status(404).json({ error: "Enrollment not found" });
            return;
        }
        res.json({ courseId: req.params.courseId, progress: enrollment.progressPercentage, completedModules: 0, totalModules: 0, lastAccessed: enrollment.updatedAt });
    }
    catch (_a) {
        res.status(500).json({ error: "Failed to fetch progress" });
    }
});
exports.getStudentProgress = getStudentProgress;
const updateStudentProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updates = req.body;
        const user = yield prisma_1.prisma.user.update({ where: { id: req.params.userId }, data: { name: updates.name, title: updates.title, bio: updates.bio, avatar: updates.avatar, isAvailableForCall: updates.isAvailableForCall, expertise: updates.expertise, socialLinks: updates.socialLinks } });
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role, title: user.title, bio: user.bio, avatar: user.avatar, isAvailableForCall: user.isAvailableForCall, expertise: user.expertise, socialLinks: user.socialLinks });
    }
    catch (_a) {
        res.status(500).json({ error: "Failed to update profile" });
    }
});
exports.updateStudentProfile = updateStudentProfile;
