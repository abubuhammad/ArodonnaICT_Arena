import { Response, NextFunction } from 'express';
import { UserRole, Permission, hasPermission } from '../lib/rbac';
import { AuthRequest } from '../types/express';

const normalizeRole = (role?: string) => (role || '').toUpperCase();

/**
 * Note: Express Request extended via types/express.d.ts::AuthRequest
 * which unifies user property across auth.ts, rbac.ts, and other auth flows
 */

/**
 * Middleware: Check if user has a specific permission
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: No user found' });
      return;
    }

    const roleNorm = normalizeRole(req.user.role as string);
    // Grant full access to any admin-family roles for backward compatibility
    const isElevatedAdmin = ['ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN', 'COURSE_ADMIN'].includes(roleNorm);
    const userRole = (roleNorm === 'ADMIN' ? UserRole.SUPER_ADMIN : (roleNorm as UserRole)) as UserRole;
    const hasRequiredPermission = isElevatedAdmin || permissions.some((perm) => hasPermission(userRole, perm));

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
export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: No user found' });
    return;
  }

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    res.status(403).json({ error: 'Forbidden: Super admin access required' });
    return;
  }

  next();
}

/**
 * Middleware: Check if user is an admin (SUPER_ADMIN or ORG_ADMIN)
 */
export function requireAdminRole(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: No user found' });
    return;
  }

  if (![UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN].includes(req.user.role as UserRole)) {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }

  next();
}

/**
 * Middleware: Check if user belongs to the same organization (org-level isolation)
 */
export function requireSameOrganization(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: No user found' });
    return;
  }

  // Super admins can access any organization
  if (req.user.role === UserRole.SUPER_ADMIN) {
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
export function auditLog(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user) {
    console.log(
      `[AUDIT] ${new Date().toISOString()} - User: ${req.user.email} (${req.user.role}) - ${req.method} ${req.path}`
    );
  }
  next();
}
