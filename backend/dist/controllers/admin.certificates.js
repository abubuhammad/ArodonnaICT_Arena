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
exports.listCertificates = exports.issueCertificate = void 0;
const crypto_1 = require("crypto");
const prisma_1 = require("../lib/prisma");
const buildDownloadUrl = (id) => `${process.env.CERTIFICATE_BASE_URL || "http://localhost:5000/certificates"}/${id}.pdf`;
const issueCertificate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const enrollment = req.body.enrollmentId ? yield prisma_1.prisma.enrollment.findUnique({ where: { id: req.body.enrollmentId }, include: { user: true, course: true } }) : yield prisma_1.prisma.enrollment.findUnique({ where: { userId_courseId: { userId: req.body.userId, courseId: req.body.courseId } }, include: { user: true, course: true } });
        if (!enrollment) {
            res.status(404).json({ error: "Enrollment not found" });
            return;
        }
        if (enrollment.status !== "COMPLETED") {
            res.status(400).json({ error: "Certificate can only be issued for completed enrollments" });
            return;
        }
        const id = (0, crypto_1.randomUUID)();
        const url = buildDownloadUrl(id);
        const certificate = yield prisma_1.prisma.certificate.create({ data: { id, enrollmentId: enrollment.id, serial: id, fileUrl: url, issuedAt: new Date() } });
        yield prisma_1.prisma.enrollment.update({ where: { id: enrollment.id }, data: { certificate: { id, issuedAt: certificate.issuedAt, downloadUrl: url } } });
        yield prisma_1.prisma.auditLog.create({ data: { actorId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, actorRole: (_b = req.user) === null || _b === void 0 ? void 0 : _b.role, actionType: "ISSUE_CERTIFICATE", resourceType: "Enrollment", resourceId: enrollment.id, details: { certificateId: id }, ipAddress: req.ip } });
        res.status(201).json({ message: "Certificate issued", certificate, enrollmentId: enrollment.id, user: { id: enrollment.user.id, name: enrollment.user.name, email: enrollment.user.email }, course: { id: enrollment.course.id, title: enrollment.course.title } });
    }
    catch (_c) {
        res.status(500).json({ error: "Failed to issue certificate" });
    }
});
exports.issueCertificate = issueCertificate;
const listCertificates = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const certificates = yield prisma_1.prisma.certificate.findMany({ where: { enrollment: { userId: req.query.userId ? String(req.query.userId) : undefined, courseId: req.query.courseId ? String(req.query.courseId) : undefined } }, include: { enrollment: { include: { user: { select: { id: true, name: true, email: true, role: true } }, course: { select: { id: true, title: true } } } } }, orderBy: { issuedAt: "desc" } });
        res.json({ certificates: certificates.map((item) => ({ enrollmentId: item.enrollmentId, user: item.enrollment.user, course: item.enrollment.course, status: item.enrollment.status, certificate: item, issuedAt: item.issuedAt })) });
    }
    catch (_a) {
        res.status(500).json({ error: "Failed to list certificates" });
    }
});
exports.listCertificates = listCertificates;
