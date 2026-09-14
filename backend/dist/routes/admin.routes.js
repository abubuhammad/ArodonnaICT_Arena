"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin.controller");
const admin_metrics_1 = require("../controllers/admin.metrics");
const admin_cache_1 = require("../controllers/admin.cache");
const admin_tenants_1 = require("../controllers/admin.tenants");
const admin_audit_1 = require("../controllers/admin.audit");
const admin_learner_1 = require("../controllers/admin.learner");
const admin_analytics_1 = require("../controllers/admin.analytics");
const admin_certificates_1 = require("../controllers/admin.certificates");
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const rbac_2 = require("../lib/rbac");
const router = express_1.default.Router();
// Apply audit logging to all admin routes
router.use(rbac_1.auditLog);
// Public routes (no auth required)
router.post("/register-admin", admin_controller_1.registerAdmin);
router.post("/admin-login", admin_controller_1.adminLogin);
// Protected routes with role-based access control
router.get("/users", auth_1.authenticateAdmin, (0, rbac_1.requirePermission)(rbac_2.Permission.LIST_USERS), admin_controller_1.getUsers);
router.get("/users/:userId/profile", auth_1.authenticateAdmin, (0, rbac_1.requirePermission)(rbac_2.Permission.LIST_USERS), admin_learner_1.getLearnerProfile);
router.get("/metrics/overview", auth_1.authenticateAdmin, (0, rbac_1.requirePermission)(rbac_2.Permission.VIEW_ANALYTICS), admin_metrics_1.metricsOverview);
router.get("/analytics", auth_1.authenticateAdmin, (0, rbac_1.requirePermission)(rbac_2.Permission.VIEW_ANALYTICS), admin_analytics_1.getAnalyticsData);
router.get("/analytics/funnels", auth_1.authenticateAdmin, (0, rbac_1.requirePermission)(rbac_2.Permission.VIEW_ANALYTICS), admin_analytics_1.getFunnelsData);
router.get("/analytics/cohorts", auth_1.authenticateAdmin, (0, rbac_1.requirePermission)(rbac_2.Permission.VIEW_ANALYTICS), admin_analytics_1.getCohortRetention);
router.get("/certificates", auth_1.authenticateAdmin, (0, rbac_1.requirePermission)(rbac_2.Permission.MANAGE_CERTIFICATES), admin_certificates_1.listCertificates);
router.get("/tenants", auth_1.authenticateAdmin, rbac_1.requireSuperAdmin, admin_tenants_1.listTenants);
router.get("/audit-logs", auth_1.authenticateAdmin, (0, rbac_1.requirePermission)(rbac_2.Permission.VIEW_AUDIT_LOGS), admin_audit_1.listAuditLogs);
router.post("/cache/clear", auth_1.authenticateAdmin, rbac_1.requireAdminRole, admin_cache_1.clearMetricsCache);
router.post("/certificates/issue", auth_1.authenticateAdmin, (0, rbac_1.requirePermission)(rbac_2.Permission.MANAGE_CERTIFICATES), admin_certificates_1.issueCertificate);
// User management routes
router.delete("/users/:id", auth_1.authenticateAdmin, (0, rbac_1.requirePermission)(rbac_2.Permission.DELETE_USER), admin_controller_1.deleteUser);
// Enrollment management routes
router.delete("/enrollments/:id", auth_1.authenticateAdmin, (0, rbac_1.requirePermission)(rbac_2.Permission.DELETE_ENROLLMENT), admin_controller_1.deleteEnrollment);
router.patch("/enrollments/:id/grant-free", auth_1.authenticateAdmin, (0, rbac_1.requirePermission)(rbac_2.Permission.GRANT_FREE_ENROLLMENT), admin_controller_1.grantFreeEnrollment);
router.post("/enrollments/grant-free", auth_1.authenticateAdmin, (0, rbac_1.requirePermission)(rbac_2.Permission.GRANT_FREE_ENROLLMENT), admin_controller_1.adminGrantFreeEnrollment);
router.patch("/enrollments/:id/verify-payment", auth_1.authenticateAdmin, (0, rbac_1.requirePermission)(rbac_2.Permission.VIEW_PAYMENTS), admin_controller_1.verifyEnrollmentPayment);
// Instructor approval
router.patch("/users/:id/approve-instructor", auth_1.authenticateAdmin, (0, rbac_1.requirePermission)(rbac_2.Permission.APPROVE_INSTRUCTOR), admin_controller_1.approveInstructor);
exports.default = router;
