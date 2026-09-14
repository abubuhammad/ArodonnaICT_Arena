import { startCourse, ensureProgress } from '../services/courseProgressService';
import { Request, Response } from "express";
import axios from "axios";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth";

const courseInclude = { course: { include: { instructor: { select: { name: true } }, category: true } } };

export const createEnrollment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized - Please log in" }); return; }
    const { courseId, paymentMethod, paymentReference } = req.body;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) { res.status(404).json({ error: "Course not found" }); return; }
    const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: req.user.id, courseId } } });
    if (existing) { res.status(409).json({ error: "You are already enrolled in this course", enrollment: existing }); return; }
    if (course.isFree) {
      const enrollment = await prisma.enrollment.create({ data: { userId: req.user.id, courseId, paymentStatus: "WAIVED" } });
      res.status(201).json({ message: "Enrollment successful", enrollment }); return;
    }
    if (!paymentMethod || !paymentReference) { res.status(400).json({ error: "Payment method and reference are required" }); return; }
    if (paymentMethod === "PAYSTACK") {
      const secret = process.env.PAYSTACK_SECRET;
      if (!secret) { res.status(500).json({ error: "PAYSTACK_SECRET is not configured" }); return; }
      const result = await axios.get(`https://api.paystack.co/transaction/verify/${paymentReference}`, { headers: { Authorization: `Bearer ${secret}` } });
      if (result.data?.data?.status !== "success") { res.status(400).json({ error: "Payment verification failed" }); return; }
    }
    const enrollment = await prisma.enrollment.create({ data: { userId: req.user.id, courseId, paymentMethod: String(paymentMethod).toUpperCase() as any, paymentReference, paymentStatus: paymentMethod === "BANK_TRANSFER" ? "PENDING" : "PAID" } });
    res.status(201).json({ message: paymentMethod === "BANK_TRANSFER" ? "Transfer reference received; awaiting verification" : "Payment verified and enrollment successful", enrollment });
  } catch (error) { console.error("Enrollment error:", error); res.status(500).json({ error: "Failed to create enrollment" }); }
};

export const getUserEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const enrollments = await prisma.enrollment.findMany({ where: { userId: req.user.id }, include: courseInclude, orderBy: { createdAt: "desc" } });
    res.json(enrollments.map((enrollment) => ({ _id: enrollment.id, userId: enrollment.userId, courseId: enrollment.course ? { _id: enrollment.course.id, title: enrollment.course.title } : undefined, status: enrollment.status, paymentStatus: enrollment.paymentStatus, paymentMethod: enrollment.paymentMethod || undefined, paymentReference: enrollment.paymentReference || undefined, createdAt: enrollment.createdAt, progressPercentage: enrollment.progressPercentage })));
  } catch (error) { console.error("Error fetching enrollments:", error); res.status(500).json({ error: "Error fetching enrollments" }); }
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || String(req.user.role).toUpperCase() !== "ADMIN") { res.status(403).json({ error: "Unauthorized - Admin access required" }); return; }
    const { verified } = req.body;
    const enrollment = await prisma.enrollment.update({ where: { id: req.params.enrollmentId || req.params.id }, data: { paymentStatus: verified ? "PAID" : "NOT_PAID", status: verified ? "ENROLLED" : undefined } });
    res.json({ message: `Payment ${verified ? "verified" : "rejected"} successfully`, enrollment });
  } catch { res.status(404).json({ error: "Enrollment not found" }); }
};

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

export const getEnrollmentProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const enrollment = await prisma.enrollment.findFirst({ where: { id: req.params.enrollmentId, userId: req.user.id }, include: { course: { include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } } } }, courseProgress: true } });
    if (!enrollment) { res.status(404).json({ error: "Enrollment not found or not owned by user" }); return; }
    if (!enrollment.courseProgress) { await startCourse(enrollment.id, req.user.id); }
    const state = await ensureProgress(enrollment.id, req.user.id);
    res.json({ enrollmentId: enrollment.id, status: enrollment.status, progressPercentage: enrollment.progressPercentage, modules: state.modules });
  } catch (error) { console.error(error); res.status(500).json({ error: "Failed to fetch enrollment progress" }); }
};

