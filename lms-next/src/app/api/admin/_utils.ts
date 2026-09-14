import { NextResponse } from 'next/server';
import { authenticateAdmin, requireAdminRole, requirePermission, requireSuperAdmin } from '@/lib/auth';
import { Permission } from '@/lib/rbac';

export async function adminGuard(request: Request, permission?: Permission) {
  const user = await authenticateAdmin(request.headers);
  if (permission) requirePermission(user, permission);
  return user;
}

export async function superAdminGuard(request: Request) {
  const user = await authenticateAdmin(request.headers);
  requireSuperAdmin(user);
  return user;
}

export async function adminRoleGuard(request: Request) {
  const user = await authenticateAdmin(request.headers);
  requireAdminRole(user);
  return user;
}

export function routeError(error: unknown, fallback: string, defaultStatus = 500) {
  if (error instanceof Error && 'status' in error) return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || defaultStatus });
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: defaultStatus });
}
