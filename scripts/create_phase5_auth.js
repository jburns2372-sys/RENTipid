const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const appsApiDir = path.join(rootDir, 'apps', 'api');

// Create directories
fs.mkdirSync(path.join(appsApiDir, 'src', 'middleware'), { recursive: true });
fs.mkdirSync(path.join(appsApiDir, 'src', 'utils'), { recursive: true });

// 1. auth.ts
fs.writeFileSync(path.join(appsApiDir, 'src', 'middleware', 'auth.ts'), [
  "import { Request, Response, NextFunction } from 'express';",
  "import jwt from 'jsonwebtoken';",
  "",
  "export interface AuthenticatedUser {",
  "  id: string;",
  "  email: string;",
  "  role: string;",
  "}",
  "",
  "declare global {",
  "  namespace Express {",
  "    interface Request {",
  "      user?: AuthenticatedUser;",
  "    }",
  "  }",
  "}",
  "",
  "// Extracts and verifies NextAuth v4 JWT session token",
  "export const requireAuth = (req: Request, res: Response, next: NextFunction) => {",
  "  const token = req.cookies?.['next-auth.session-token'] || req.headers.authorization?.split(' ')[1];",
  "  ",
  "  if (!token) {",
  "    return res.status(401).json({ error: 'Unauthorized: No token provided' });",
  "  }",
  "",
  "  try {",
  "    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as AuthenticatedUser;",
  "    req.user = decoded;",
  "    next();",
  "  } catch (error) {",
  "    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });",
  "  }",
  "};"
].join('\\n'));

// 2. rbac.ts
fs.writeFileSync(path.join(appsApiDir, 'src', 'middleware', 'rbac.ts'), [
  "import { Request, Response, NextFunction } from 'express';",
  "",
  "export const requireRole = (allowedRoles: string[]) => {",
  "  return (req: Request, res: Response, next: NextFunction) => {",
  "    if (!req.user) {",
  "      return res.status(401).json({ error: 'Unauthorized: Missing user context' });",
  "    }",
  "",
  "    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'Super Admin') {",
  "      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });",
  "    }",
  "",
  "    next();",
  "  };",
  "};",
  "",
  "// Pre-configured strict roles",
  "export const isFinanceAdmin = requireRole(['Finance Admin']);",
  "export const isComplianceAdmin = requireRole(['Compliance Admin']);",
  "export const isAdmin = requireRole(['Admin', 'Finance Admin', 'Compliance Admin']);",
  "export const isProvider = requireRole(['Individual Provider', 'Business Provider']);"
].join('\\n'));

// 3. ownership.ts
fs.writeFileSync(path.join(appsApiDir, 'src', 'utils', 'ownership.ts'), [
  "import { PrismaClient } from '@prisma/client';",
  "const prisma = new PrismaClient();",
  "",
  "export const isListingOwner = async (userId: string, listingId: string): Promise<boolean> => {",
  "  const listing = await prisma.listing.findUnique({",
  "    where: { id: listingId },",
  "    select: { provider_id: true }",
  "  });",
  "  return listing?.provider_id === userId;",
  "};",
  "",
  "export const isBookingOwner = async (userId: string, bookingId: string): Promise<boolean> => {",
  "  const booking = await prisma.booking.findUnique({",
  "    where: { id: bookingId },",
  "    select: { renter_id: true, listing: { select: { provider_id: true } } }",
  "  });",
  "  // Allow access if user is either the Renter or the Provider",
  "  return booking?.renter_id === userId || booking?.listing.provider_id === userId;",
  "};"
].join('\\n'));

// 4. Update package.json
const pkgPath = path.join(appsApiDir, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.dependencies = pkg.dependencies || {};
  pkg.dependencies['jsonwebtoken'] = '^9.0.2';
  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies['@types/jsonwebtoken'] = '^9.0.6';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

console.log("Phase 5 Authentication scaffolded.");
