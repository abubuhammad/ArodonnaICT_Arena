/**
 * RBAC Permission System
 * Defines roles, permissions, and scope levels for the LMS admin system
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  COURSE_ADMIN = 'COURSE_ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  SUPPORT = 'SUPPORT',
  ANALYST = 'ANALYST',
  STUDENT = 'STUDENT',
}

export enum Scope {
  GLOBAL = 'GLOBAL',
  ORGANIZATION = 'ORGANIZATION',
  COURSE = 'COURSE',
}

export enum Permission {
  // User management
  LIST_USERS = 'list_users',
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  APPROVE_INSTRUCTOR = 'approve_instructor',
  MANAGE_ROLES = 'manage_roles',

  // Course management
  LIST_COURSES = 'list_courses',
  CREATE_COURSE = 'create_course',
  UPDATE_COURSE = 'update_course',
  DELETE_COURSE = 'delete_course',
  PUBLISH_COURSE = 'publish_course',
  REVIEW_COURSE = 'review_course',

  // Enrollment management
  LIST_ENROLLMENTS = 'list_enrollments',
  CREATE_ENROLLMENT = 'create_enrollment',
  DELETE_ENROLLMENT = 'delete_enrollment',
  GRANT_FREE_ENROLLMENT = 'grant_free_enrollment',

  // Content management
  UPLOAD_CONTENT = 'upload_content',
  MANAGE_ASSESSMENTS = 'manage_assessments',
  MANAGE_CERTIFICATES = 'manage_certificates',

  // Finance
  VIEW_PAYMENTS = 'view_payments',
  PROCESS_REFUND = 'process_refund',
  MANAGE_PRICING = 'manage_pricing',

  // Analytics
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_DATA = 'export_data',

  // Support & Moderation
  VIEW_SUPPORT_TICKETS = 'view_support_tickets',
  MODERATE_CONTENT = 'moderate_content',
  MANAGE_COMMUNITY = 'manage_community',

  // Audit & Compliance
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_COMPLIANCE = 'manage_compliance',

  // System admin
  MANAGE_SYSTEM = 'manage_system',
  MANAGE_TENANTS = 'manage_tenants',
  MANAGE_INTEGRATIONS = 'manage_integrations',
}

/**
 * Role to Permissions mapping
 * Defines what permissions each role has at different scope levels
 */
export const rolePermissions: Record<UserRole, Permission[]> = {
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
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if role is an admin role (for quick checks)
 */
export function isAdminRole(role: UserRole): boolean {
  return [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.COURSE_ADMIN].includes(role);
}
