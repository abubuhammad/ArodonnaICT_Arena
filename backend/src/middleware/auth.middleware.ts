import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

interface TokenPayload {
  id: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// No-op placeholder to keep the middleware edit scoped
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add user to request object
    (req as any).user = { id: user.id, role: user.role };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', expired: true });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const verifyInstructor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'INSTRUCTOR') {
      return res.status(403).json({ message: 'Access denied. Instructor role required.' });
    }

    // Check if token is about to expire (less than 1 hour remaining)
    const timeToExpire = (decoded.exp || 0) - Math.floor(Date.now() / 1000);
    if (timeToExpire < 3600) {
      // Generate new token
      const newToken = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' }
      );
      
      // Add new token to response headers
      res.setHeader('X-New-Token', newToken);
    }

    // Add user to request object
    (req as any).user = { id: user.id, role: user.role };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Instructor session expired. Please log in again.',
        expired: true 
      });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to refresh token if it's about to expire
export const refreshTokenIfNeeded = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
    
    // Check if token is about to expire (less than 1 hour remaining)
    const timeToExpire = (decoded.exp || 0) - Math.floor(Date.now() / 1000);
    if (timeToExpire < 3600) {
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (user) {
        const newToken = jwt.sign(
          { id: user.id, role: user.role },
          process.env.JWT_SECRET as string,
          { expiresIn: '1d' }
        );
        res.setHeader('X-New-Token', newToken);
      }
    }
    next();
  } catch (error) {
    // If there's an error, just continue without refreshing
    next();
  }
}; 