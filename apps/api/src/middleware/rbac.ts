import { Request, Response, NextFunction } from 'express';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Missing user context' });
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

// Pre-configured strict roles
export const isFinanceAdmin = requireRole(['Finance Admin']);
export const isComplianceAdmin = requireRole(['Compliance Admin']);
export const isAdmin = requireRole(['Admin', 'Finance Admin', 'Compliance Admin']);
export const isProvider = requireRole(['Individual Provider', 'Business Provider']);