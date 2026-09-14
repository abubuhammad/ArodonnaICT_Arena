import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth";

export const getInstructorStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const courses = await prisma.course.findMany({ where: { instructorId: req.params.instructorId }, include: { enrollments: true } });
    const enrollments = courses.flatMap((course) => course.enrollments);
    const completed = enrollments.filter((item) => item.progressPercentage >= 100).length;
    const revenue = enrollments.reduce((sum, item) => sum + Number(item.instructorShareAmount || 0), 0) || courses.reduce((sum, course) => sum + (course.isFree ? 0 : Number(course.price) * course.enrollments.length), 0);
    res.json({ totalStudents: new Set(enrollments.map((item) => item.userId)).size, totalCourses: courses.length, completionRate: enrollments.length ? Math.round(completed / enrollments.length * 100) : 0, activeEnrollments: enrollments.length, averageRating: 0, totalRevenue: revenue });
  } catch (error) { console.error(error); res.status(500).json({ error: "Failed to fetch instructor statistics" }); }
};

export const getInstructorCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const courses = await prisma.course.findMany({ where: { instructorId: req.params.instructorId }, include: { enrollments: true } });
    res.json(courses.map((course) => ({
      _id: course.id,
      title: course.title,
      description: course.description,
      price: Number(course.price),
      isFree: course.isFree,
      thumbnail: course.thumbnail || "/images/course-default.jpg",
      duration: course.duration || "0 hours",
      level: course.level || "Beginner",
      instructor: req.params.instructorId,
      enrolledStudents: course.enrollments.map((item) => item.userId),
      completedStudents: course.enrollments.filter((item) => item.progressPercentage >= 100).map((item) => item.userId),
      rating: 0,
      revenue: course.enrollments.reduce((sum, item) => sum + Number(item.instructorShareAmount || 0), 0) || (course.isFree ? 0 : Number(course.price) * course.enrollments.length),
    })));
  } catch { res.status(500).json({ error: "Failed to fetch instructor courses" }); }
};

export const requestInstructorRole = async (req: Request, res: Response): Promise<void> => {
  try { const user = await prisma.user.findUnique({ where: { id: req.body.userId } }); if (!user) { res.status(404).json({ error: "User not found" }); return; } if (user.role === "INSTRUCTOR") { res.json({ message: "Already an instructor" }); return; } await prisma.user.update({ where: { id: user.id }, data: { role: "PENDING" } }); res.json({ message: "Instructor request submitted for approval" }); }
  catch { res.status(500).json({ error: "Failed to request instructor role" }); }
};

export const approveInstructorRequest = async (req: Request, res: Response): Promise<void> => {
  try { const user = await prisma.user.findUnique({ where: { id: req.params.userId } }); if (!user) { res.status(404).json({ error: "User not found" }); return; } if (user.role !== "PENDING") { res.status(400).json({ error: "User has not requested instructor role" }); return; } await prisma.user.update({ where: { id: user.id }, data: { role: "INSTRUCTOR" } }); res.json({ message: "Instructor role approved successfully" }); }
  catch { res.status(500).json({ error: "Failed to approve instructor role" }); }
};

export const getEnrollmentProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const courses = await prisma.course.findMany({ where: { instructorId: req.params.instructorId }, select: { id: true, title: true } });
    const enrollments = await prisma.enrollment.findMany({ where: { courseId: { in: courses.map((course) => course.id) } }, include: { user: { select: { name: true, email: true } }, course: { select: { title: true } } }, orderBy: { enrolledAt: "desc" } });
    res.json(enrollments.map((item) => ({ enrollmentId: item.id, user: item.user, course: item.course, enrolledAt: item.enrolledAt, progress: { status: item.progressPercentage >= 100 ? "completed" : item.progressPercentage > 0 ? "in-progress" : "not-started", completedLessons: 0, totalLessons: 0, percentage: item.progressPercentage } })));
  } catch { res.status(500).json({ error: "Failed to fetch enrollment progress" }); }
};

export const getInstructorRequestStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try { const user = await prisma.user.findUnique({ where: { id: req.user?.id } }); if (!user) { res.status(404).json({ error: "User not found" }); return; } res.json({ status: user.role === "INSTRUCTOR" ? "approved" : user.role === "PENDING" ? "pending" : "none" }); }
  catch { res.status(500).json({ error: "Failed to check instructor status" }); }
};

export const getInstructorProfile = async (req: Request, res: Response): Promise<void> => {
  try { const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, name: true, email: true, role: true, title: true, avatar: true, bio: true, isAvailableForCall: true, expertise: true, socialLinks: true } }); if (!user) { res.status(404).json({ error: "Instructor not found" }); return; } res.json(user); }
  catch { res.status(500).json({ error: "Failed to fetch instructor profile" }); }
};

export const getInstructorEarnings = async (req: Request, res: Response): Promise<void> => {
  try { const courses = await prisma.course.findMany({ where: { instructorId: req.params.instructorId }, include: { enrollments: true } }); const earnings = courses.flatMap((course) => course.enrollments.filter((item) => item.paymentStatus === "PAID").map((item) => ({ courseId: course.id, courseTitle: course.title, amount: Number(item.instructorShareAmount || item.amountPaid || 0), date: item.createdAt }))); res.json({ total: earnings.reduce((sum, item) => sum + item.amount, 0), earnings }); }
  catch { res.status(500).json({ error: "Failed to fetch earnings" }); }
};

export const updateInstructorProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try { const user = await prisma.user.update({ where: { id: req.user?.id }, data: { name: req.body.name, title: req.body.title, bio: req.body.bio, avatar: req.body.avatar, isAvailableForCall: req.body.isAvailableForCall, expertise: req.body.expertise, socialLinks: req.body.socialLinks } }); res.json(user); }
  catch { res.status(500).json({ error: "Failed to update instructor profile" }); }
};
