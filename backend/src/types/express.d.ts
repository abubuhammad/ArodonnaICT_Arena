import { Request } from 'express';
import { UserRole } from '../lib/rbac';

/**
 * Unified Express Request type for both user and admin authentication
 */
export interface AuthRequest extends Request {
  user?: {
    _id?: string;          // Admin/super admin
    id?: string;           // Regular user (backward compat)
    email?: string;
    role?: string | UserRole;
    organizationId?: string;
  };
}

export interface UserRequest extends Request {
  user?: AuthRequest['user'];
}
