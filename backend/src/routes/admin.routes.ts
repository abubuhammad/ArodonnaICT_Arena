import express from "express";
import { 
  registerAdmin, 
  adminLogin, 
  getUsers,
  deleteUser, // <-- Import deleteUser
  deleteEnrollment,
  grantFreeEnrollment,
  adminGrantFreeEnrollment,
  approveInstructor,
  verifyEnrollmentPayment
} from "../controllers/admin.controller";
import { metricsOverview } from "../controllers/admin.metrics";
import { clearMetricsCache } from "../controllers/admin.cache";
import { listTenants } from "../controllers/admin.tenants";
import { listAuditLogs } from "../controllers/admin.audit";
import { getLearnerProfile } from "../controllers/admin.learner";
import { getAnalyticsData, getFunnelsData, getCohortRetention } from "../controllers/admin.analytics";
import { issueCertificate, listCertificates, assignInstructorCertificateTemplate } from "../controllers/admin.certificates";
import { getCourses, updateCourseStatus } from "../controllers/course.controller";
import { authenticateAdmin } from "../middlewares/auth";
import { 
  requirePermission, 
  requireSuperAdmin,
  requireAdminRole,
  auditLog
} from "../middlewares/rbac";
import { Permission } from "../lib/rbac";

const router = express.Router();

// Apply audit logging to all admin routes
router.use(auditLog);

// Public routes (no auth required)
router.post("/register-admin", registerAdmin);
router.post("/admin-login", adminLogin);

// Protected routes with role-based access control
router.get("/users", authenticateAdmin, requirePermission(Permission.LIST_USERS), getUsers);
router.put("/instructors/:instructorId/certificate-template", authenticateAdmin, requirePermission(Permission.MANAGE_CERTIFICATES), assignInstructorCertificateTemplate);
router.get("/courses", authenticateAdmin, getCourses);
router.patch("/courses/:courseId/status", authenticateAdmin, updateCourseStatus);
router.get("/users/:userId/profile", authenticateAdmin, requirePermission(Permission.LIST_USERS), getLearnerProfile);
router.get("/metrics/overview", authenticateAdmin, requirePermission(Permission.VIEW_ANALYTICS), metricsOverview);
router.get("/analytics", authenticateAdmin, requirePermission(Permission.VIEW_ANALYTICS), getAnalyticsData);
router.get("/analytics/funnels", authenticateAdmin, requirePermission(Permission.VIEW_ANALYTICS), getFunnelsData);
router.get("/analytics/cohorts", authenticateAdmin, requirePermission(Permission.VIEW_ANALYTICS), getCohortRetention);
router.get("/certificates", authenticateAdmin, requirePermission(Permission.MANAGE_CERTIFICATES), listCertificates);
router.get("/tenants", authenticateAdmin, requireSuperAdmin, listTenants);
router.get("/audit-logs", authenticateAdmin, requirePermission(Permission.VIEW_AUDIT_LOGS), listAuditLogs);
router.post("/cache/clear", authenticateAdmin, requireAdminRole, clearMetricsCache);
router.post("/certificates/issue", authenticateAdmin, requirePermission(Permission.MANAGE_CERTIFICATES), issueCertificate);

// User management routes
router.delete("/users/:id", authenticateAdmin, requirePermission(Permission.DELETE_USER), deleteUser);

// Enrollment management routes
router.delete("/enrollments/:id", authenticateAdmin, requirePermission(Permission.DELETE_ENROLLMENT), deleteEnrollment);
router.patch("/enrollments/:id/grant-free", authenticateAdmin, requirePermission(Permission.GRANT_FREE_ENROLLMENT), grantFreeEnrollment);
router.post("/enrollments/grant-free", authenticateAdmin, requirePermission(Permission.GRANT_FREE_ENROLLMENT), adminGrantFreeEnrollment);
router.patch("/enrollments/:id/verify-payment", authenticateAdmin, requirePermission(Permission.VIEW_PAYMENTS), verifyEnrollmentPayment);

// Instructor approval
router.patch("/users/:id/approve-instructor", authenticateAdmin, requirePermission(Permission.APPROVE_INSTRUCTOR), approveInstructor);

export default router;
