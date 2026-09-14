import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getLearnerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const enrollments = await prisma.enrollment.findMany({ where: { userId: user.id }, include: { course: { select: { title: true } } } });
    const completed = enrollments.filter((item) => item.status === "COMPLETED");
    res.json({ _id: user.id, ...user, enrollments: enrollments.map((item) => ({ _id: item.id, courseId: item.courseId, courseName: item.course.title, status: item.status, progress: item.progressPercentage, enrolledAt: item.enrolledAt, certificate: item.certificate })), totalEnrollments: enrollments.length, completedCourses: completed.length, certificatesIssued: completed.filter((item) => item.certificate).length, averageProgress: enrollments.length ? Math.round(enrollments.reduce((sum, item) => sum + item.progressPercentage, 0) / enrollments.length) : 0 });
  } catch { res.status(500).json({ error: "Failed to fetch learner profile" }); }
};
