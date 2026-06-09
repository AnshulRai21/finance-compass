import { Request, Response, NextFunction } from 'express';
import { verifyToken, validateSession } from '../config/auth';
import { getDatabase } from '../config/database';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Authentication middleware
 * Verifies JWT token and session validity
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Validate session exists and is active
    const isValidSession = await validateSession(payload.sessionId, token);
    if (!isValidSession) {
      res.status(401).json({ error: 'Session invalid or expired' });
      return;
    }

    // Fetch user details
    const db = getDatabase();
    const user = await db.get(
      `SELECT id, email, name FROM users WHERE id = ? AND is_active = 1`,
      [payload.userId]
    );

    if (!user) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    req.userId = payload.userId;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional authentication middleware
 * Doesn't fail if no token provided, but validates if present
 */
export async function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = verifyToken(token);

      if (payload) {
        const isValidSession = await validateSession(payload.sessionId, token);
        if (isValidSession) {
          const db = getDatabase();
          const user = await db.get(
            `SELECT id, email, name FROM users WHERE id = ? AND is_active = 1`,
            [payload.userId]
          );

          if (user) {
            req.userId = payload.userId;
            req.user = user;
          }
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
}

/**
 * Check if user owns the requested resource
 */
export function checkResourceOwnership(param: string = 'userId') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const resourceUserId = req.params[param];
    
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.userId !== resourceUserId) {
      res.status(403).json({ error: 'Access denied: you do not own this resource' });
      return;
    }

    next();
  };
}
