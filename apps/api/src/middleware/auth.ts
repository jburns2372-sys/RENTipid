import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logApiSecurityEvent } from 'rentipid/src/lib/security/events/writers/api-security-writer';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

declare global {
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
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (error) {
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
