# Master Implementation Registry

## Existing Architecture
- Framework: Next.js 16 App Router, React 19, TypeScript
- UI: Tailwind CSS, Shadcn UI
- Database: Prisma 6.19.3, PostgreSQL (Neon for production)
- Auth: NextAuth.js
- PWA/Mobile: Capacitor

## Relevant Routes
- Public: `/prohibited-items` (currently a placeholder)
- Admin/Compliance: `/dashboard` (Admin dashboard exists)
- Provider Listing Workflow: `/listing`
- Auth: `/login`, `/register`, `/account`

## Relevant Prisma Models
- User models: `User`, `UserProfile`, `BusinessProfile`
- Listing models: `Category`, `Listing`, `ListingPhoto`, `ListingDocument`
- Audit system: `AuditLog`, `ApiSecurityLog`, `AuthenticationSecurityLog`, `SystemErrorLog`
- Reporting: `IncidentCase`, `IncidentCaseNote`, `IncidentCaseEvidence` (SOC integration)
- Approval models: `SecurityResponseApprovalRequest`, `SecurityResponseApprovalDecision`

## RBAC Implementation
- Current implementation resides in `src/lib/permissions.ts` and `src/lib/auth.ts`.
- Uses role-based strings on the `User` model, backed by a permissions service.

## Audit Implementation
- Core auditing resides in `src/lib/audit.ts`.
- Database mapping to `AuditLog`.

## Security Event Implementation
- Ingestion and taxonomy in `src/lib/security/events/`.
- Playbooks and rules in `src/lib/security/rules/` and `src/lib/security/playbooks/`.
- SOC operations integrated.

## Reporting Implementation
- Tied into `IncidentCase` and `SecurityResponseExecution`.

## Upload Implementation
- Uploads happen for `ListingPhoto`, `ListingDocument`, and `VerificationDocument`.

## Notification Implementation
- `Notification` model handles internal notifications.

## Test Infrastructure
- E2E Tests: Playwright (`playwright.config.ts`)
- Unit/Integration Tests: Jest (`jest.config.js`)

## Seed Infrastructure
- Controlled via `prisma/seed.ts` or related scripts (like `scripts/run-test-database-guard.ts`).

## Integration Boundaries
- Modules must integrate using existing `audit.ts`, `permissions.ts`, and `security/events/` taxonomy.
