# Current State Inventory

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
