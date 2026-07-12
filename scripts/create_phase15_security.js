const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const appsApiDir = path.join(rootDir, 'apps', 'api');

// 1. rateLimiter.ts
fs.writeFileSync(path.join(appsApiDir, 'src', 'middleware', 'rateLimiter.ts'), [
  "import rateLimit from 'express-rate-limit';",
  "",
  "/**",
  " * Phase 15: General API Rate Limiting to prevent basic DoS attacks.",
  " * Limits IPs to 100 requests per minute.",
  " */",
  "export const generalLimiter = rateLimit({",
  "  windowMs: 1 * 60 * 1000, // 1 minute",
  "  max: 100,",
  "  message: { error: 'Too many requests from this IP, please try again after a minute.' },",
  "  standardHeaders: true,",
  "  legacyHeaders: false,",
  "});",
  "",
  "/**",
  " * Strict Limiter specifically for Bookings or Financial endpoints.",
  " * Limits IPs to 5 requests per minute.",
  " */",
  "export const strictLimiter = rateLimit({",
  "  windowMs: 1 * 60 * 1000, // 1 minute",
  "  max: 5,",
  "  message: { error: 'Strict rate limit exceeded for sensitive action. Try again later.' },",
  "  standardHeaders: true,",
  "  legacyHeaders: false,",
  "});"
].join('\\n'));

// 2. auditService.ts
fs.writeFileSync(path.join(appsApiDir, 'src', 'services', 'auditService.ts'), [
  "import { PrismaClient } from '@prisma/client';",
  "import * as appInsights from 'applicationinsights';",
  "",
  "const prisma = new PrismaClient();",
  "",
  "/**",
  " * Creates an immutable Audit Log record for high-risk system actions.",
  " * @param actorId - The user or system account performing the action",
  " * @param action - Structured action string (e.g., 'BOOKING_CREATED', 'PAYMENT_REFUNDED')",
  " * @param targetResource - The ID of the affected resource (e.g., bookingId)",
  " * @param details - JSON blob of old/new values or contextual context",
  " * @param correlationId - Propagated trace ID to link backend DB to frontend click",
  " */",
  "export const logAuditAction = async (",
  "  actorId: string,",
  "  action: string,",
  "  targetResource: string,",
  "  details: any,",
  "  correlationId?: string",
  ") => {",
  "  try {",
  "    // Phase 15: We assume there's an AuditLog table mapped in Prisma.",
  "    // If it doesn't exist yet, it must be added to schema.prisma.",
  "    // await prisma.auditLog.create({",
  "    //   data: { actorId, action, targetResource, details, correlationId }",
  "    // });",
  "    ",
  "    // For now, we strictly emit this to AppInsights so it's queryable immediately.",
  "    const client = appInsights.defaultClient;",
  "    if (client) {",
  "      client.trackEvent({",
  "        name: `Audit_${action}`,",
  "        properties: {",
  "          actorId,",
  "          targetResource,",
  "          correlationId,",
  "          ...details",
  "        }",
  "      });",
  "    }",
  "    console.log(`[AUDIT] ${action} executed by ${actorId} on ${targetResource}`);",
  "  } catch (error) {",
  "    // Never fail the primary transaction because the audit logger failed,",
  "    // but flag it heavily in standard error logs.",
  "    console.error('CRITICAL: Failed to write audit log', error);",
  "  }",
  "};"
].join('\\n'));

// 3. Update package.json
const pkgPath = path.join(appsApiDir, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.dependencies = pkg.dependencies || {};
  pkg.dependencies['express-rate-limit'] = '^7.1.5';
  pkg.dependencies['helmet'] = '^7.1.0';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

// 4. Mount in index.ts
const indexPath = path.join(appsApiDir, 'src', 'index.ts');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  if (!indexContent.includes('helmet')) {
    indexContent = indexContent.replace(
      "import { correlationMiddleware } from './middleware/correlationId';",
      "import { correlationMiddleware } from './middleware/correlationId';\\nimport helmet from 'helmet';\\nimport { generalLimiter, strictLimiter } from './middleware/rateLimiter';"
    );
    indexContent = indexContent.replace(
      "app.use(mobileCorsMiddleware);",
      "app.use(mobileCorsMiddleware);\\napp.use(helmet());\\napp.use(generalLimiter);"
    );
    
    // Mount strict limiter specifically to bookings
    indexContent = indexContent.replace(
      "app.use('/bookings', bookingRoutes);",
      "app.use('/bookings', strictLimiter, bookingRoutes);"
    );
    fs.writeFileSync(indexPath, indexContent);
  }
}

console.log("Phase 15 Security Enhancements scaffolded.");
