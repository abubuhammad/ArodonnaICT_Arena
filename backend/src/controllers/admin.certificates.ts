import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma";

export const assignInstructorCertificateTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const instructorId = String(req.params.instructorId);
    const instructor = await prisma.user.findUnique({ where: { id: instructorId }, select: { id: true, role: true } });
    if (!instructor || instructor.role !== "INSTRUCTOR") { res.status(404).json({ error: "Instructor not found" }); return; }
    const template = req.body?.template;
    if (template !== null && (typeof template !== "object" || Array.isArray(template))) { res.status(400).json({ error: "Template must be an object or null" }); return; }
    const updated = await prisma.user.update({ where: { id: instructorId }, data: { certificateTemplate: template || null }, select: { id: true, certificateTemplate: true } });
    res.json({ message: "Certificate template assigned", instructor: updated });
  } catch (error) { console.error("Failed to assign certificate template", error); res.status(500).json({ error: "Failed to assign certificate template" }); }
};

const buildDownloadUrl = (id: string) => `${process.env.CERTIFICATE_BASE_URL || "http://localhost:5000/api/certificates"}/${id}/download`;

export const issueCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const enrollment = req.body.enrollmentId ? await prisma.enrollment.findUnique({ where: { id: req.body.enrollmentId }, include: { user: true, course: { include: { instructor: true } } } }) : await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: req.body.userId, courseId: req.body.courseId } }, include: { user: true, course: { include: { instructor: true } } } });
    if (!enrollment) { res.status(404).json({ error: "Enrollment not found" }); return; }
    if (enrollment.status !== "COMPLETED") { res.status(400).json({ error: "Certificate can only be issued for completed enrollments" }); return; }
    const id = randomUUID(); const url = buildDownloadUrl(id);
    const certificate = await prisma.certificate.create({ data: { id, enrollmentId: enrollment.id, serial: id, fileUrl: url, issuedAt: new Date(), metadata: { template: enrollment.course.instructor.certificateTemplate || null } } });
    await prisma.enrollment.update({ where: { id: enrollment.id }, data: { certificate: { id, issuedAt: certificate.issuedAt, downloadUrl: url } } });
    await prisma.auditLog.create({ data: { actorId: (req as any).user?.id, actorRole: (req as any).user?.role, actionType: "ISSUE_CERTIFICATE", resourceType: "Enrollment", resourceId: enrollment.id, details: { certificateId: id }, ipAddress: req.ip } });
    res.status(201).json({ message: "Certificate issued", certificate, enrollmentId: enrollment.id, user: { id: enrollment.user.id, name: enrollment.user.name, email: enrollment.user.email }, course: { id: enrollment.course.id, title: enrollment.course.title } });
  } catch { res.status(500).json({ error: "Failed to issue certificate" }); }
};

export const listCertificates = async (req: Request, res: Response): Promise<void> => {
  try { const certificates = await prisma.certificate.findMany({ where: { enrollment: { userId: req.query.userId ? String(req.query.userId) : undefined, courseId: req.query.courseId ? String(req.query.courseId) : undefined } }, include: { enrollment: { include: { user: { select: { id: true, name: true, email: true, role: true } }, course: { select: { id: true, title: true } } } } }, orderBy: { issuedAt: "desc" } }); res.json({ certificates: certificates.map((item) => ({ enrollmentId: item.enrollmentId, user: item.enrollment.user, course: item.enrollment.course, status: item.enrollment.status, certificate: { ...item, fileUrl: `${process.env.CERTIFICATE_BASE_URL || "http://localhost:5000/api/certificates"}/${item.id}/download` }, issuedAt: item.issuedAt })) }); }
  catch { res.status(500).json({ error: "Failed to list certificates" }); }
};
