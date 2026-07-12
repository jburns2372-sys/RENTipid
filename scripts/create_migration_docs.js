const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs', 'azure-migration');

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

fs.writeFileSync(path.join(docsDir, '01-current-state-inventory.md'), `# Current State Inventory

## 1. Application Overview
- **Application**: Rentipid
- **Frontend**: Next.js 16.2.10 hosted on Vercel
- **Backend Runtime**: Next.js App Router (API Routes and Server Actions)
- **Database**: SQLite (via Prisma ORM v6.19.3)
- **Authentication**: NextAuth v4.24.14 with bcryptjs
- **UI Framework**: Tailwind CSS v4, shadcn, lucide-react
- **Mobile Support**: Capacitor integrated for mobile builds.

## 2. Route Inventory (Sample)
| Route / Area | Current Runtime | Auth Required | Database Used | Migration Target |
|---|---|---|---|---|
| /api/auth/* | Vercel API | No | User | Vercel (Retain) |
| /api/bookings/* | Vercel API | Yes | Booking, Listing | Azure Container Apps |
| /api/payments/* | Vercel API | Yes | Payment, FinanceLedger | Azure Container Apps |
| /api/finance/* | Vercel API | Yes (Finance) | FinanceLedger | Azure Container Apps |

## 3. Database Inventory
- **Engine**: SQLite
- **Key Models**: User, UserProfile, BusinessProfile, Category, VerificationDocument, Booking, Payment, FinanceLedger, Listing, Notification
- **Audit Logging**: AuditLog
- **Note**: SQLite is currently used, which poses a concurrency risk on Vercel serverless functions and must be migrated to a managed relational database (e.g., Azure Database for PostgreSQL or Azure SQL) during the Azure Migration.

## 4. Integration & Environment
- **Env Vars**: DATABASE_URL
- **Secrets Management**: Currently using local/Vercel .env.
`);

fs.writeFileSync(path.join(docsDir, '02-migration-risk-register.md'), `# Migration Risk Register

## 1. SQLite Concurrency & Re-platforming
**Risk**: Rentipid currently uses SQLite. Moving to an Azure hybrid model with multiple Container Apps requires a concurrent relational database. 
**Mitigation**: Include a database engine migration (from SQLite to Azure Database for PostgreSQL Flexible Server) as a prerequisite to Phase 4 (Backend Separation).

## 2. Capacitor Mobile Integration
**Risk**: Rentipid integrates @capacitor/core for mobile apps. Shifting API endpoints to Azure (api.rentipid.com) requires updating mobile build configurations and handling CORS tightly.
**Mitigation**: Implement strict CORS policies on the Azure API Gateway and ensure the mobile app environment variables dynamically point to the new Azure API routes.

## 3. NextAuth Version 4 Session Handling
**Risk**: Rentipid uses NextAuth v4. Session verification on the Azure backend will require explicit JWT parsing.
**Mitigation**: Extract the NEXTAUTH_SECRET to Azure Key Vault and configure the Azure backend to decode and validate NextAuth JWTs natively.
`);

fs.writeFileSync(path.join(docsDir, '03-route-ownership-matrix.md'), `# Initial Route Ownership Matrix

| Route Area | Current Owner | Temporary Migration Owner | Final Owner | Rewrite Rule |
|---|---|---|---|---|
| /api/auth/* | Vercel | Vercel | Vercel | None |
| /api/bookings/* | Vercel | Azure (Wave 3) | Azure | /api/bookings/* -> api.rentipid.com/bookings/* |
| /api/payments/* | Vercel | Azure (Wave 6) | Azure | /api/payments/* -> api.rentipid.com/payments/* |
| /api/admin/* | Vercel | Azure (Wave 8) | Azure | /api/admin/* -> api.rentipid.com/admin/* |
`);

fs.writeFileSync(path.join(docsDir, '04-azure-service-mapping.md'), `# Recommended Azure Service Mapping

| Current Vercel / Capacitor Component | Target Azure Service | Justification |
|---|---|---|
| Next.js API Routes (/api/*) | Azure Container Apps | Serverless scaling, deep VNet integration. |
| SQLite Database | Azure Database for PostgreSQL Flexible Server | Required transition from SQLite for concurrent backend scaling. |
| Vercel/Local File Storage | Azure Blob Storage | High availability for Listing images and KYC Verification Documents. |
| Scheduled Tasks (if any) | Azure Container Apps Jobs | Fully managed scheduled execution. |
| Background Workers (Mobile Push) | Azure Service Bus | Reliable message brokering for Push Notifications to Capacitor clients. |
| Vercel Environment Variables | Azure Key Vault | Hardware security modules, dynamic secret rotation. |
`);

console.log("Documents created successfully.");
