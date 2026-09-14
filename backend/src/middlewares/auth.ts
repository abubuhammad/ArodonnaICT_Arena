// src/middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { UserRole } from "../lib/rbac";

export interface AuthRequest extends Request {
  user?: { id: string; email?: string; role: string; organizationId?: string };
}

const normalizeRole = (role?: string) => (role || '').toUpperCase();

export const authenticateUser = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error("❌ No Bearer token found in request headers");
    res.status(401).json({ error: "Unauthorized - Bearer token is required" });
    return;
  }

  const token = authHeader.split(' ')[1];
  console.log("🔹 Received Token in Backend:", token);

  if (!token) {
    console.error("❌ No token found in request headers");
    res.status(401).json({ error: "Unauthorized - Token is required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; role: string };
    req.user = decoded;
    console.log("✅ Token Verified Successfully:", decoded);
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired", expired: true });
      return;
    }
    console.error("❌ User authentication failed:", error);
    res.status(401).json({ error: "Invalid token" });
    return;
  }
};

export const authenticateAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies?.adminToken;

  if (!token) {
    res.status(401).json({ error: "Admin token required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { 
      id: string; 
      email?: string;
      role?: string;
      organizationId?: string;
    };

    const admin = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!admin) {
      res.status(403).json({ error: "Invalid admin credentials" });
      return;
    }

    const normalizedTokenRole = normalizeRole(decoded.role);
    const normalizedDbRole = normalizeRole(admin.role);
    const resolvedRole = normalizedTokenRole || normalizedDbRole;

    // Verify admin role (supports both old and new role systems)
    const adminRoles = ['ADMIN', UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.COURSE_ADMIN];
    if (!adminRoles.includes(resolvedRole)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    // Normalize legacy ADMIN to SUPER_ADMIN for RBAC checks downstream
    const effectiveRole = resolvedRole === 'ADMIN' ? UserRole.SUPER_ADMIN : (resolvedRole as UserRole | string);

    req.user = {
      id: decoded.id,
      email: decoded.email || admin.email,
      role: effectiveRole,
      organizationId: decoded.organizationId,
    };
    next();
  } catch (error) {
    console.error("❌ Admin authentication failed:", error);
    res.status(403).json({ error: "Invalid or expired admin token" });
  }
};


export const authenticateInstructor = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; role: string };
    if (decoded.role !== "INSTRUCTOR") {
      res.status(403).json({ error: "Instructor access required" });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid token" });
    return;
  }
};

export const authenticateInstructorOrAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const headerToken = req.headers.authorization?.split(" ")[1];
  const cookieToken = (req as any).cookies?.adminToken;
  const token = headerToken || cookieToken;

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; role: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    const role = normalizeRole(user?.role || decoded.role);

    if (role !== "INSTRUCTOR" && role !== "ADMIN") {
      res.status(403).json({ error: "Instructor or admin access required" });
      return;
    }

    req.user = { id: decoded.id, role };
    next();
  } catch (error) {
    console.error("❌ Instructor/Admin authentication failed:", error);
    res.status(403).json({ error: "Invalid token" });
    return;
  }
};
