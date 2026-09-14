"use strict";
/**
 * RBAC Permission System
 * Defines roles, permissions, and scope levels for the LMS admin system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolePermissions = exports.Permission = exports.Scope = exports.UserRole = void 0;
exports.hasPermission = hasPermission;
exports.getRolePermissions = getRolePermissions;
exports.isAdminRole = isAdminRole;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ORG_ADMIN"] = "ORG_ADMIN";
    UserRole["COURSE_ADMIN"] = "COURSE_ADMIN";
    UserRole["INSTRUCTOR"] = "INSTRUCTOR";
    UserRole["SUPPORT"] = "SUPPORT";
    UserRole["ANALYST"] = "ANALYST";
    UserRole["STUDENT"] = "STUDENT";
})(UserRole || (exports.UserRole = UserRole = {}));
var Scope;
(function (Scope) {
    Scope["GLOBAL"] = "GLOBAL";
    Scope["ORGANIZATION"] = "ORGANIZATION";
    Scope["COURSE"] = "COURSE";
})(Scope || (exports.Scope = Scope = {}));
var Permission;
(function (Permission) {
    // User management
    Permission["LIST_USERS"] = "list_users";
    Permission["CREATE_USER"] = "create_user";
    Permission["UPDATE_USER"] = "update_user";
    Permission["DELETE_USER"] = "delete_user";
    Permission["APPROVE_INSTRUCTOR"] = "approve_instructor";
    Permission["MANAGE_ROLES"] = "manage_roles";
    // Course management
    Permission["LIST_COURSES"] = "list_courses";
    Permission["CREATE_COURSE"] = "create_course";
    Permission["UPDATE_COURSE"] = "update_course";
    Permission["DELETE_COURSE"] = "delete_course";
    Permission["PUBLISH_COURSE"] = "publish_course";
    Permission["REVIEW_COURSE"] = "review_course";
    // Enrollment management
    Permission["LIST_ENROLLMENTS"] = "list_enrollments";
    Permission["CREATE_ENROLLMENT"] = "create_enrollment";
    Permission["DELETE_ENROLLMENT"] = "delete_enrollment";
    Permission["GRANT_FREE_ENROLLMENT"] = "grant_free_enrollment";
    // Content management
    Permission["UPLOAD_CONTENT"] = "upload_content";
    Permission["MANAGE_ASSESSMENTS"] = "manage_assessments";
    Permission["MANAGE_CERTIFICATES"] = "manage_certificates";
    // Finance
    Permission["VIEW_PAYMENTS"] = "view_payments";
    Permission["PROCESS_REFUND"] = "process_refund";
    Permission["MANAGE_PRICING"] = "manage_pricing";
    // Analytics
    Permission["VIEW_ANALYTICS"] = "view_analytics";
    Permission["EXPORT_DATA"] = "export_data";
    // Support & Moderation
    Permission["VIEW_SUPPORT_TICKETS"] = "view_support_tickets";
    Permission["MODERATE_CONTENT"] = "moderate_content";
    Permission["MANAGE_COMMUNITY"] = "manage_community";
    // Audit & Compliance
    Permission["VIEW_AUDIT_LOGS"] = "view_audit_logs";
    Permission["MANAGE_COMPLIANCE"] = "manage_compliance";
    // System admin
    Permission["MANAGE_SYSTEM"] = "manage_system";
    Permission["MANAGE_TENANTS"] = "manage_tenants";
    Permission["MANAGE_INTEGRATIONS"] = "manage_integrations";
})(Permission || (exports.Permission = Permission = {}));
/**
 * Role to Permissions mapping
 * Defines what permissions each role has at different scope levels
 */
exports.rolePermissions = {
    [UserRole.SUPER_ADMIN]: [
        // Full access to everything
        Permission.LIST_USERS,
        Permission.CREATE_USER,
        Permission.UPDATE_USER,
        Permission.DELETE_USER,
        Permission.APPROVE_INSTRUCTOR,
        Permission.MANAGE_ROLES,
        Permission.LIST_COURSES,
        Permission.CREATE_COURSE,
        Permission.UPDATE_COURSE,
        Permission.DELETE_COURSE,
        Permission.PUBLISH_COURSE,
        Permission.REVIEW_COURSE,
        Permission.LIST_ENROLLMENTS,
        Permission.CREATE_ENROLLMENT,
        Permission.DELETE_ENROLLMENT,
        Permission.GRANT_FREE_ENROLLMENT,
        Permission.UPLOAD_CONTENT,
        Permission.MANAGE_ASSESSMENTS,
        Permission.MANAGE_CERTIFICATES,
        Permission.VIEW_PAYMENTS,
        Permission.PROCESS_REFUND,
        Permission.MANAGE_PRICING,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_DATA,
        Permission.VIEW_SUPPORT_TICKETS,
        Permission.MODERATE_CONTENT,
        Permission.MANAGE_COMMUNITY,
        Permission.VIEW_AUDIT_LOGS,
        Permission.MANAGE_COMPLIANCE,
        Permission.MANAGE_SYSTEM,
        Permission.MANAGE_TENANTS,
        Permission.MANAGE_INTEGRATIONS,
    ],
    [UserRole.ORG_ADMIN]: [
        // Organization-level admin (no system management)
        Permission.LIST_USERS,
        Permission.CREATE_USER,
        Permission.UPDATE_USER,
        Permission.DELETE_USER,
        Permission.APPROVE_INSTRUCTOR,
        Permission.LIST_COURSES,
        Permission.CREATE_COURSE,
        Permission.UPDATE_COURSE,
        Permission.DELETE_COURSE,
        Permission.PUBLISH_COURSE,
        Permission.REVIEW_COURSE,
        Permission.LIST_ENROLLMENTS,
        Permission.CREATE_ENROLLMENT,
        Permission.DELETE_ENROLLMENT,
        Permission.GRANT_FREE_ENROLLMENT,
        Permission.UPLOAD_CONTENT,
        Permission.MANAGE_ASSESSMENTS,
        Permission.MANAGE_CERTIFICATES,
        Permission.VIEW_PAYMENTS,
        Permission.PROCESS_REFUND,
        Permission.MANAGE_PRICING,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_DATA,
        Permission.VIEW_SUPPORT_TICKETS,
        Permission.MODERATE_CONTENT,
        Permission.MANAGE_COMMUNITY,
        Permission.VIEW_AUDIT_LOGS,
    ],
    [UserRole.COURSE_ADMIN]: [
        // Course-level admin (manages content and enrollments for assigned courses)
        Permission.LIST_COURSES,
        Permission.UPDATE_COURSE,
        Permission.PUBLISH_COURSE,
        Permission.LIST_ENROLLMENTS,
        Permission.CREATE_ENROLLMENT,
        Permission.DELETE_ENROLLMENT,
        Permission.GRANT_FREE_ENROLLMENT,
        Permission.UPLOAD_CONTENT,
        Permission.MANAGE_ASSESSMENTS,
        Permission.MANAGE_CERTIFICATES,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_DATA,
    ],
    [UserRole.INSTRUCTOR]: [
        // Instructor (manages own courses)
        Permission.LIST_COURSES,
        Permission.UPDATE_COURSE,
        Permission.LIST_ENROLLMENTS,
        Permission.UPLOAD_CONTENT,
        Permission.MANAGE_ASSESSMENTS,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_DATA,
    ],
    [UserRole.SUPPORT]: [
        // Support/Moderator (read-only admin tools + support functions)
        Permission.LIST_USERS,
        Permission.LIST_COURSES,
        Permission.LIST_ENROLLMENTS,
        Permission.GRANT_FREE_ENROLLMENT,
        Permission.VIEW_PAYMENTS,
        Permission.VIEW_SUPPORT_TICKETS,
        Permission.MODERATE_CONTENT,
        Permission.MANAGE_COMMUNITY,
        Permission.VIEW_AUDIT_LOGS,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_DATA,
    ],
    [UserRole.ANALYST]: [
        // Analyst (read-only access to analytics and reports)
        Permission.LIST_USERS,
        Permission.LIST_COURSES,
        Permission.LIST_ENROLLMENTS,
        Permission.VIEW_PAYMENTS,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_DATA,
        Permission.VIEW_AUDIT_LOGS,
    ],
    [UserRole.STUDENT]: [
    // Student (no admin permissions)
    ],
};
/**
 * Check if a user role has a specific permission
 */
function hasPermission(role, permission) {
    const permissions = exports.rolePermissions[role] || [];
    return permissions.includes(permission);
}
/**
 * Get all permissions for a role
 */
function getRolePermissions(role) {
    return exports.rolePermissions[role] || [];
}
/**
 * Check if role is an admin role (for quick checks)
 */
function isAdminRole(role) {
    return [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.COURSE_ADMIN].includes(role);
}
