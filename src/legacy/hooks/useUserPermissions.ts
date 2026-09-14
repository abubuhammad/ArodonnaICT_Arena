import { useSelector } from 'react-redux';
import { RootState } from '../store';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  COURSE_ADMIN = 'COURSE_ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  SUPPORT = 'SUPPORT',
  ANALYST = 'ANALYST',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN', // Legacy role
}

export enum Permission {
  LIST_USERS = 'list_users',
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  APPROVE_INSTRUCTOR = 'approve_instructor',
  MANAGE_ROLES = 'manage_roles',
  LIST_COURSES = 'list_courses',
  CREATE_COURSE = 'create_course',
  UPDATE_COURSE = 'update_course',
  DELETE_COURSE = 'delete_course',
  PUBLISH_COURSE = 'publish_course',
  REVIEW_COURSE = 'review_course',
  LIST_ENROLLMENTS = 'list_enrollments',
  CREATE_ENROLLMENT = 'create_enrollment',
  DELETE_ENROLLMENT = 'delete_enrollment',
  GRANT_FREE_ENROLLMENT = 'grant_free_enrollment',
  UPLOAD_CONTENT = 'upload_content',
  MANAGE_ASSESSMENTS = 'manage_assessments',
  MANAGE_CERTIFICATES = 'manage_certificates',
  VIEW_PAYMENTS = 'view_payments',
  PROCESS_REFUND = 'process_refund',
  MANAGE_PRICING = 'manage_pricing',
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_DATA = 'export_data',
  VIEW_SUPPORT_TICKETS = 'view_support_tickets',
  MODERATE_CONTENT = 'moderate_content',
  MANAGE_COMMUNITY = 'manage_community',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_COMPLIANCE = 'manage_compliance',
  MANAGE_SYSTEM = 'manage_system',
  MANAGE_TENANTS = 'manage_tenants',
  MANAGE_INTEGRATIONS = 'manage_integrations',
}

const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.ORG_ADMIN]: [
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
    Permission.LIST_COURSES,
    Permission.UPDATE_COURSE,
    Permission.LIST_ENROLLMENTS,
    Permission.UPLOAD_CONTENT,
    Permission.MANAGE_ASSESSMENTS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_DATA,
  ],
  [UserRole.SUPPORT]: [
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
    Permission.LIST_USERS,
    Permission.LIST_COURSES,
    Permission.LIST_ENROLLMENTS,
    Permission.VIEW_PAYMENTS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_DATA,
    Permission.VIEW_AUDIT_LOGS,
  ],
  [UserRole.STUDENT]: [],
  [UserRole.ADMIN]: Object.values(Permission), // Legacy: full permissions
};

export function useUserPermissions() {
  const { adminUser } = useSelector((state: RootState) => state.auth);

  const role = (adminUser?.role || UserRole.STUDENT) as UserRole;
  const permissions = rolePermissions[role] || [];

  const can = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const canAny = (...perms: Permission[]): boolean => {
    return perms.some((p) => permissions.includes(p));
  };

  const canAll = (...perms: Permission[]): boolean => {
    return perms.every((p) => permissions.includes(p));
  };

  const canDelete = (resource: 'user' | 'course' | 'enrollment'): boolean => {
    const permMap: Record<string, Permission> = {
      user: Permission.DELETE_USER,
      course: Permission.DELETE_COURSE,
      enrollment: Permission.DELETE_ENROLLMENT,
    };
    return can(permMap[resource]);
  };

  return {
    role,
    permissions,
    can,
    canAny,
    canAll,
    canDelete,
  };
}

export function useRoleDisplay(role?: UserRole | string) {
  const roleMap: Record<string, { label: string; color: string }> = {
    [UserRole.SUPER_ADMIN]: { label: 'Super Admin', color: 'from-red-500 to-pink-500' },
    [UserRole.ORG_ADMIN]: { label: 'Organization Admin', color: 'from-blue-500 to-indigo-500' },
    [UserRole.COURSE_ADMIN]: { label: 'Course Admin', color: 'from-purple-500 to-violet-500' },
    [UserRole.INSTRUCTOR]: { label: 'Instructor', color: 'from-emerald-500 to-teal-500' },
    [UserRole.SUPPORT]: { label: 'Support', color: 'from-amber-500 to-orange-500' },
    [UserRole.ANALYST]: { label: 'Analyst', color: 'from-cyan-500 to-blue-500' },
    [UserRole.STUDENT]: { label: 'Student', color: 'from-slate-400 to-slate-500' },
    ADMIN: { label: 'Admin', color: 'from-indigo-500 to-purple-500' },
  };

  return roleMap[role || ''] || { label: 'Unknown', color: 'from-gray-400 to-gray-500' };
}
