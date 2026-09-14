import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { certificatePdfBuffer } from "../services/certificatePdf";

export const downloadCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: req.params.certificateId },
      include: { enrollment: { include: { user: true, course: { include: { instructor: true } } } } },
    });
    if (!certificate || certificate.revoked) { res.status(404).json({ error: "Certificate not found" }); return; }
    const metadata = certificate.metadata && typeof certificate.metadata === "object" ? certificate.metadata as any : {};
    const buffer = await certificatePdfBuffer({
      learnerName: certificate.enrollment.user.name,
      courseTitle: certificate.enrollment.course.title,
      instructorName: certificate.enrollment.course.instructor.name,
      serial: certificate.serial,
      issuedAt: certificate.issuedAt,
      template: metadata.template || certificate.enrollment.course.instructor.certificateTemplate as any,
    });
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="certificate-${certificate.serial}.pdf"` });
    res.send(buffer);
  } catch (error) { console.error("Failed to download certificate", error); res.status(500).json({ error: "Failed to generate certificate" }); }
};