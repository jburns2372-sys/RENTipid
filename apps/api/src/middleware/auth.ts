import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logApiSecurityEvent } from '../../../../src/lib/security/events/writers/api-security-writer';
import { PrismaClient } from '@prisma/client';
import {
  getPhase1PermissionsForRole,
  type SecurityPermission,
} from '../../../../src/lib/security/permissions';

const prisma = new PrismaClient();

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

declare global {
  // Express request augmentation requires declaration merging with its namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Extracts and verifies NextAuth v4 JWT session token
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.['next-auth.session-token'] || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    logApiSecurityEvent({
      event_code: 'API_AUTHORIZATION_DENIED',
      outcome: 'DENIED',
      raw_ip: req.ip || req.socket.remoteAddress,
      safe_route_family: req.baseUrl + req.route?.path,
      http_method: req.method,
      policy_family: 'AUTHENTICATION_REQUIRED',
      sanitized_metadata: { reason: 'No token provided' }
    });
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return res.status(503).json({ error: 'Authentication unavailable' });
    }
    const decoded = jwt.verify(token, secret) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch {
    logApiSecurityEvent({
      event_code: 'API_AUTHORIZATION_DENIED',
      outcome: 'DENIED',
      raw_ip: req.ip || req.socket.remoteAddress,
      safe_route_family: req.baseUrl + req.route?.path,
      http_method: req.method,
      policy_family: 'AUTHENTICATION_INVALID',
      sanitized_metadata: { reason: 'Invalid or expired token' }
    });
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

async function getVerifiedDatabaseUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });
}

function forbidden(res: Response) {
  return res.status(403).json({ error: 'Forbidden' });
}

export const requirePermission = (permission: SecurityPermission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const dbUser = await getVerifiedDatabaseUser(req.user.id);
      if (!dbUser || dbUser.status !== 'Verified') return forbidden(res);

      const permissions = getPhase1PermissionsForRole(dbUser.role);
      if (!permissions.includes(permission)) return forbidden(res);

      next();
    } catch {
      return res.status(503).json({ error: 'Authorization unavailable' });
    }
  };
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const dbUser = await getVerifiedDatabaseUser(req.user.id);
    const allowedRoles = new Set(['Admin', 'Compliance Admin', 'Super Admin']);
    if (!dbUser || dbUser.status !== 'Verified' || !allowedRoles.has(dbUser.role)) {
      return forbidden(res);
    }

    next();
  } catch {
    return res.status(503).json({ error: 'Authorization unavailable' });
  }
};
