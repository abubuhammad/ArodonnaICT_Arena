import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export const registerAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    if (await prisma.user.count({ where: { role: "ADMIN" } })) { if (!process.env.ADMIN_SETUP_TOKEN || req.headers["x-setup-token"] !== process.env.ADMIN_SETUP_TOKEN) { res.status(403).json({ error: "Admin creation locked. Provide valid X-Setup-Token." }); return; } }
    const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (existing) { res.status(400).json({ error: "Admin already exists" }); return; }
    await prisma.user.create({ data: { name: req.body.name, email: req.body.email, password: await bcrypt.hash(req.body.password, 10), role: "ADMIN" } });
    res.status(201).json({ message: "Admin created successfully" });
  } catch { res.status(500).json({ error: "Failed to create admin" }); }
};

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const admin = await prisma.user.findFirst({ where: { email, role: "ADMIN" } });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (!process.env.JWT_SECRET) {
      console.error("Admin login failed: JWT_SECRET is not configured");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    const token = jwt.sign({ id: admin.id, role: "ADMIN" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({
      message: "Admin login successful",
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUsers = async (_req: Request, res: Response): Promise<void> => { try { res.json(await prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true, title: true, avatar: true, bio: true, isAvailableForCall: true, expertise: true, socialLinks: true, createdAt: true } })); } catch { res.status(500).json({ error: "Error fetching users" }); } };

export const getEnrollments = async (_req: Request, res: Response): Promise<void> => { try { const items = await prisma.enrollment.findMany({ orderBy: { createdAt: "desc" }, include: { course: { select: { id: true, title: true } }, user: { select: { id: true, name: true, email: true } } } }); res.json(items.map((item) => ({ id: item.id, status: item.status, paymentStatus: item.paymentStatus, paymentMethod: item.paymentMethod, paymentReference: item.paymentReference, progressPercentage: item.progressPercentage, enrolledAt: item.enrolledAt, createdAt: item.createdAt, course: item.course, user: item.user }))); } catch { res.status(500).json({ error: "Error fetching enrollments" }); } };

export const deleteEnrollment = async (req: Request, res: Response): Promise<void> => { try { await prisma.enrollment.delete({ where: { id: req.params.id } }); res.json({ message: "Enrollment deleted successfully" }); } catch { res.status(404).json({ error: "Enrollment not found" }); } };
export const grantFreeEnrollment = async (req: Request, res: Response): Promise<void> => { try { const updated = await prisma.enrollment.update({ where: { id: req.params.id }, data: { paymentStatus: "WAIVED" } }); res.json(updated); } catch { res.status(404).json({ error: "Enrollment not found" }); } };
export const adminGrantFreeEnrollment = async (req: Request, res: Response): Promise<void> => { try { const enrollment = await prisma.enrollment.upsert({ where: { userId_courseId: { userId: req.body.userId, courseId: req.body.courseId } }, update: { paymentStatus: "WAIVED", status: "ENROLLED" }, create: { userId: req.body.userId, courseId: req.body.courseId, paymentStatus: "WAIVED" } }); res.status(201).json({ message: "Free enrollment granted", enrollment }); } catch { res.status(500).json({ error: "Failed to grant free enrollment" }); } };
export const verifyEnrollmentPayment = async (req: Request, res: Response): Promise<void> => { try { const updated = await prisma.enrollment.update({ where: { id: req.params.id }, data: { paymentStatus: req.body.verified ? "PAID" : "NOT_PAID", status: "ENROLLED" } }); res.json({ message: "Payment status updated", enrollment: updated }); } catch { res.status(404).json({ error: "Enrollment not found" }); } };
export const approveInstructor = async (req: Request, res: Response): Promise<void> => { try { const user = await prisma.user.findUnique({ where: { id: req.params.id } }); if (!user) { res.status(404).json({ error: "User not found" }); return; } if (user.role !== "PENDING") { res.status(400).json({ error: "User is not pending instructor approval" }); return; } const updated = await prisma.user.update({ where: { id: user.id }, data: { role: "INSTRUCTOR" } }); res.json({ message: "Instructor approved successfully", user: updated }); } catch { res.status(500).json({ error: "Failed to approve instructor" }); } };
export const deleteUser = async (req: Request, res: Response): Promise<void> => { try { const user = await prisma.user.findUnique({ where: { id: req.params.id } }); if (!user) { res.status(404).json({ error: "User not found" }); return; } await prisma.user.delete({ where: { id: user.id } }); await prisma.auditLog.create({ data: { actorId: (req as any).user?.id, actorRole: (req as any).user?.role, actionType: "DELETE_USER", resourceType: "User", resourceId: user.id, details: { email: user.email, name: user.name }, ipAddress: req.ip } }); res.json({ message: "User deleted successfully" }); } catch { res.status(500).json({ error: "Failed to delete user" }); } };
