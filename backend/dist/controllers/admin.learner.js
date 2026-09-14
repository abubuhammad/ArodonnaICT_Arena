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
exports.getLearnerProfile = void 0;
const prisma_1 = require("../lib/prisma");
const getLearnerProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: req.params.userId }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        const enrollments = yield prisma_1.prisma.enrollment.findMany({ where: { userId: user.id }, include: { course: { select: { title: true } } } });
        const completed = enrollments.filter((item) => item.status === "COMPLETED");
        res.json(Object.assign(Object.assign({ _id: user.id }, user), { enrollments: enrollments.map((item) => ({ _id: item.id, courseId: item.courseId, courseName: item.course.title, status: item.status, progress: item.progressPercentage, enrolledAt: item.enrolledAt, certificate: item.certificate })), totalEnrollments: enrollments.length, completedCourses: completed.length, certificatesIssued: completed.filter((item) => item.certificate).length, averageProgress: enrollments.length ? Math.round(enrollments.reduce((sum, item) => sum + item.progressPercentage, 0) / enrollments.length) : 0 }));
    }
    catch (_a) {
        res.status(500).json({ error: "Failed to fetch learner profile" });
    }
});
exports.getLearnerProfile = getLearnerProfile;
