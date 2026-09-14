"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
exports.requireSuperAdmin = requireSuperAdmin;
exports.requireAdminRole = requireAdminRole;
exports.requireSameOrganization = requireSameOrganization;
exports.auditLog = auditLog;
const rbac_1 = require("../lib/rbac");
const normalizeRole = (role) => (role || '').toUpperCase();
/**
 * Note: Express Request extended via types/express.d.ts::AuthRequest
 * which unifies user property across auth.ts, rbac.ts, and other auth flows
 */
/**
 * Middleware: Check if user has a specific permission
 */
function requirePermission(...permissions) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized: No user found' });
            return;
        }
        const roleNorm = normalizeRole(req.user.role);
        // Grant full access to any admin-family roles for backward compatibility
        const isElevatedAdmin = ['ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN', 'COURSE_ADMIN'].includes(roleNorm);
        const userRole = (roleNorm === 'ADMIN' ? rbac_1.UserRole.SUPER_ADMIN : roleNorm);
        const hasRequiredPermission = isElevatedAdmin || permissions.some((perm) => (0, rbac_1.hasPermission)(userRole, perm));
        if (!hasRequiredPermission) {
            res.status(403).json({
                error: 'Forbidden: Insufficient permissions',
                requiredPermissions: permissions,
            });
            return;
        }
        next();
    };
}
/**
 * Middleware: Check if user has SUPER_ADMIN role
 */
function requireSuperAdmin(req, res, next) {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: No user found' });
        return;
    }
    if (req.user.role !== rbac_1.UserRole.SUPER_ADMIN) {
        res.status(403).json({ error: 'Forbidden: Super admin access required' });
        return;
    }
    next();
}
/**
 * Middleware: Check if user is an admin (SUPER_ADMIN or ORG_ADMIN)
 */
function requireAdminRole(req, res, next) {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: No user found' });
        return;
    }
    if (![rbac_1.UserRole.SUPER_ADMIN, rbac_1.UserRole.ORG_ADMIN].includes(req.user.role)) {
        res.status(403).json({ error: 'Forbidden: Admin access required' });
        return;
    }
    next();
}
/**
 * Middleware: Check if user belongs to the same organization (org-level isolation)
 */
function requireSameOrganization(req, res, next) {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: No user found' });
        return;
    }
    // Super admins can access any organization
    if (req.user.role === rbac_1.UserRole.SUPER_ADMIN) {
        next();
        return;
    }
    // For org admins and others, verify organizationId matches
    const requestedOrgId = req.body.organizationId || req.query.organizationId;
    if (requestedOrgId && requestedOrgId !== req.user.organizationId) {
        res.status(403).json({ error: 'Forbidden: Cannot access other organizations' });
        return;
    }
    next();
}
/**
 * Middleware: Log access for audit trail (can be enhanced)
 */
function auditLog(req, res, next) {
    if (req.user) {
        console.log(`[AUDIT] ${new Date().toISOString()} - User: ${req.user.email} (${req.user.role}) - ${req.method} ${req.path}`);
    }
    next();
}
