import { Request, Response, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

interface TokenPayload {
  id: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// ✅ Properly typed user registration function
export const register: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const roleEnum = (role || 'STUDENT').toString().toUpperCase();
    const created = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: roleEnum === 'INSTRUCTOR' ? 'INSTRUCTOR' : roleEnum === 'ADMIN' ? 'ADMIN' : roleEnum === 'PENDING' ? 'PENDING' : 'STUDENT'
      }
    });

    res.status(201).json({ message: "User registered successfully", user: { id: created.id, name: created.name, email: created.email, role: created.role } });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
};

// ✅ Properly typed user login function
export const login: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Login request received:", req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log("Missing email or password");
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    let passwordMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", passwordMatch ? "Yes" : "No");

    // Legacy fallback: some older users may have plaintext or differently-hashed passwords
    if (!passwordMatch) {
      if (user.password && user.password === password) {
        console.warn("Legacy plaintext password detected. Rehashing now for user:", user.email);
        const newHash = await bcrypt.hash(password, 10);
        await prisma.user.update({ where: { id: user.id }, data: { password: newHash } });
        passwordMatch = true;
      }
    }

    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET environment variable is not set");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    if (!process.env.JWT_REFRESH_SECRET) {
      console.error("JWT_REFRESH_SECRET environment variable is not set");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: "7d" }
    );

    // Set refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log("Login successful for user:", user.email);
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

export const adminLogin: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const admin = await prisma.user.findFirst({ where: { email, role: 'ADMIN' } });

    if (!admin) {
      res.status(401).json({ error: "Invalid admin credentials" });
      return;
    }

    // Verify password
    const ok = await (await import('bcryptjs')).compare(password, admin.password);
    if (!ok) {
      res.status(401).json({ error: "Invalid admin credentials" });
      return;
    }

    // Sign token with role so middleware can authorize
    const token = jwt.sign(
      { id: admin.id, role: 'ADMIN' },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    const payload = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    // Return shape expected by frontend (admin key, plus token)
    res.json({ token, admin: payload, user: payload });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: "Server error" });
  }
};

export const refreshToken: RequestHandler = async (req: Request, res: Response) => {
  try {
    // Accept refresh token from cookie first, fallback to body
    const tokenFromCookie = (req as any).cookies?.refreshToken;
    const tokenFromBody = (req.body && req.body.refreshToken) || null;
    const incomingRefreshToken = tokenFromCookie || tokenFromBody;

    if (!incomingRefreshToken) {
      res.status(400).json({ message: 'Refresh token is required' });
      return;
    }

    // Verify the refresh token
    const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET as string) as TokenPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Generate new tokens
    const newToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    const newRefreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Refresh token expired' });
      return;
    }
    res.status(401).json({ message: 'Invalid refresh token' });
    return;
  }
};

export const getCurrentUser: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; role: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email
      });
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({ error: "Failed to get current user" });
  }
};
