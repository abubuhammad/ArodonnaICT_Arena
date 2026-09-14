import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { Permission, UserRole, hasPermission } from './rbac';

export interface AuthUser {
  id: string;
  email?: string;
  role: string;
  organizationId?: string;
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export const normalizeRole = (role?: string) => (role || '').toUpperCase();

export function getBearerToken(
  headers?: Headers | Record<string, string | undefined>
): string {
  const authHeader =
    headers instanceof Headers ? headers.get('authorization') : headers?.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Unauthorized - Bearer token is required', 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AuthError('Unauthorized - Token is required', 401);
  }

  return token;
}

export function authenticateUser(
  headers?: Headers | Record<string, string | undefined>
): AuthUser {
  const token = getBearerToken(headers);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser;
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError('Token expired', 401);
    }

    throw new AuthError('Invalid token', 401);
  }
}

export async function authenticateAdmin(
  headers?: Headers | Record<string, string | undefined>
): Promise<AuthUser> {
  const token = getBearerToken(headers);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser;
    const admin = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!admin) {
      throw new AuthError('Invalid admin credentials', 403);
    }

    const normalizedTokenRole = normalizeRole(decoded.role);
    const normalizedDbRole = normalizeRole(admin.role);
    const resolvedRole = normalizedTokenRole || normalizedDbRole;

    const adminRoles = ['ADMIN', UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.COURSE_ADMIN];
    if (!adminRoles.includes(resolvedRole)) {
      throw new AuthError('Admin access required', 403);
    }

    const effectiveRole = resolvedRole === 'ADMIN' ? UserRole.SUPER_ADMIN : resolvedRole;

    return {
      id: decoded.id,
      email: decoded.email || admin.email,
      role: effectiveRole,
      organizationId: decoded.organizationId,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError('Invalid or expired admin token', 403);
    }

    throw new AuthError('Invalid or expired admin token', 403);
  }
}

export function requirePermission(
  user: { role?: string } | null | undefined,
  ...permissions: Permission[]
): boolean {
  if (!user) {
    throw new AuthError('Unauthorized: No user found', 401);
  }

  const roleNorm = normalizeRole(user.role as string);
  const isElevatedAdmin = ['ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN', 'COURSE_ADMIN'].includes(roleNorm);
  const resolvedUserRole = (roleNorm === 'ADMIN' ? UserRole.SUPER_ADMIN : (roleNorm as UserRole)) as UserRole;
  const hasRequiredPermission = isElevatedAdmin || permissions.some((perm) => hasPermission(resolvedUserRole, perm));

  if (!hasRequiredPermission) {
    throw new AuthError('Forbidden: Insufficient permissions', 403);
  }

  return true;
}

export function requireSuperAdmin(user: { role?: string } | null | undefined): boolean {
  if (!user) {
    throw new AuthError('Unauthorized: No user found', 401);
  }

  if (normalizeRole(user.role) !== UserRole.SUPER_ADMIN) {
    throw new AuthError('Forbidden: Super admin access required', 403);
  }

  return true;
}

export function requireAdminRole(user: { role?: string } | null | undefined): boolean {
  if (!user) {
    throw new AuthError('Unauthorized: No user found', 401);
  }

  if (![UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN].includes(normalizeRole(user.role) as UserRole)) {
    throw new AuthError('Forbidden: Admin access required', 403);
  }

  return true;
}

export function requireSameOrganization(
  user: { role?: string; organizationId?: string } | null | undefined,
  data?: Record<string, unknown>,
  query?: Record<string, unknown>
): boolean {
  if (!user) {
    throw new AuthError('Unauthorized: No user found', 401);
  }

  if (normalizeRole(user.role) === UserRole.SUPER_ADMIN) {
    return true;
  }

  const requestedOrgId = data?.organizationId ?? query?.organizationId;
  if (requestedOrgId && requestedOrgId !== user.organizationId) {
    throw new AuthError('Forbidden: Cannot access other organizations', 403);
  }

  return true;
}
