# Authoritative Local Production Function Manifest
**Release Baseline:** `rentipid-unified-auth-v1.1.0-frozen` (`c0254631ea55030fd8e6c21ee73bc7a4563173ff`)  
**Scope:** Complete User-Facing and Operator-Facing Application Surface  
**Generated:** September 19, 2026  

---

## 1. Manifest Structure & Methodology

Every functional capability discovered in the frozen runtime source is recorded below with its production route, local route, external dependency profile, production configuration type, required local equivalent, test procedure, expected behavior, and current remediation status.

---

## 2. Function Matrix

### 2.1 Authentication & Identity Gateway

| Feature | Production Route / API | Local Route / API | External Dependency | Production Config Type | Required Local / Dev Equivalent | Test Procedure | Expected Result | Current Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| **Email Registration** | `/auth/register`<br>`POST /api/auth/register` | `/auth/register`<br>`POST /api/auth/register` | SMTP / Mailer | Cloud SMTP | Local mail capture / DB verification token | Submit new email & password payload | User created in DB with status UNVERIFIED | Pending local test | **PENDING** |
| **Email Verification** | `POST /api/auth/email-verification/verify` | `POST /api/auth/email-verification/verify` | None (Token verify) | HMAC / DB token | Local DB token record | Dispatch POST request with valid token JSON | Email marked verified (`emailVerified` set) | Pending local test | **PENDING** |
| **Email/Password Login** | `/auth/login`<br>`POST /api/auth/callback/credentials` | `/auth/login`<br>`POST /api/auth/callback/credentials` | None (bcrypt) | Argon2 / bcrypt | Local DB password hash match | Submit verified user email and password | JWT session token issued, session cookie set | Pending local test | **PENDING** |
| **Email Invalid Password Rejection** | `POST /api/auth/callback/credentials` | `POST /api/auth/callback/credentials` | None | None | Local bcrypt failure | Submit wrong password for registered user | 401 Unauthorized returned, no session | Pending local test | **PENDING** |
| **WhatsApp OTP Request** | `POST /api/auth/otp` | `POST /api/auth/otp` | Twilio Verify / WhatsApp API | Twilio WhatsApp Production sender | Twilio WhatsApp Sandbox (`join <word>`) | Request OTP for enrolled test phone | 200 OK, message delivered to WhatsApp device | Failed previously (undelivered) | **PENDING** |
| **WhatsApp OTP Verification** | `POST /api/auth/callback/phone-otp` | `POST /api/auth/callback/phone-otp` | Twilio Verify API | Twilio Production Verify Service | Twilio Sandbox Verify Service | Submit received 6-digit OTP code | OTP validated, session cookie issued | Pending local test | **PENDING** |
| **Google OAuth Login** | `/auth/login`<br>`GET/POST /api/auth/callback/google` | `https://local.rentipid.com.ph/api/auth/callback/google` | Google Cloud OAuth 2.0 | Production Web Client | Dedicated Dev Web Client (`local.rentipid.com.ph`) | Click "Continue with Google" in browser | Redirects to Google, grants consent, returns to local | Failed (401 invalid_client) | **PENDING** |
| **Facebook OAuth Login** | `/auth/login`<br>`GET/POST /api/auth/callback/facebook` | `https://local.rentipid.com.ph/api/auth/callback/facebook` | Meta Graph OAuth 2.0 | Production Meta App | Dedicated Meta Dev App (`local.rentipid.com.ph`) | Click "Continue with Facebook" in browser | Authorizes on Facebook, returns valid token | Failed (Invalid App ID) | **PENDING** |
| **Apple OAuth Login** | `/auth/login`<br>`POST /api/auth/callback/apple` | `https://local.rentipid.com.ph/api/auth/callback/apple` | Apple ID Web Authentication | Production Services ID | Dev Services ID (`com.rentipid.web` HTTPS return) | Click "Continue with Apple", authenticate | Apple posts form_post to local HTTPS, session set | Failed (Invalid redirect URL) | **PENDING** |
| **Connected Methods Query** | `GET /api/account/connected-methods` | `GET /api/account/connected-methods` | None | Session Cookie | Local session query | Query connected methods with active session | JSON list of active providers (`google`, `apple`, etc.) | Pending local test | **PENDING** |
| **Explicit Provider Linking** | `POST /api/auth/oauth/link-intent`<br>`POST /api/auth/link` | Same | OAuth Providers | Session + OAuth | Local session + Dev OAuth client | Initiate linking from Account Security | New provider attached to existing user ID | Pending local test | **PENDING** |
| **Provider Collision Protection** | `POST /api/auth/link` | Same | OAuth Providers | Database Constraint | Local DB unique index check | Attempt to link provider account already bound | 409 Conflict / Provider Collision error | Pending local test | **PENDING** |
| **Session Retrieval** | `GET /api/auth/session` | `GET /api/auth/session` | NextAuth Engine | JWT secret | Local `NEXTAUTH_SECRET` | Fetch session endpoint with session cookie | 200 OK with user object, role, and email | PASS (Local test verified) | **PASS** |
| **Session Termination (Logout)** | `POST /api/auth/logout` | `POST /api/auth/logout` | None | NextAuth Session Store | Local session revocation | Submit logout request | Session cookie cleared, redirected to login | Pending local test | **PENDING** |

---

### 2.2 Marketplace, Listings & Search

| Feature | Production Route / API | Local Route / API | External Dependency | Production Config Type | Required Local / Dev Equivalent | Test Procedure | Expected Result | Current Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| **Listing Browse & Filter** | `/browse`<br>`GET /api/listings` | Same | None (PostgreSQL) | Neon Production DB | `rentipid_local_dev` | Query listings with category & price filters | 200 OK with list of matching active listings | Pending local test | **PENDING** |
| **Listing Detail View** | `/listings/[id]` | Same | None (PostgreSQL) | Neon Production DB | `rentipid_local_dev` | Fetch public listing detail page by ID | Full listing view rendered with pricing and owner | Pending local test | **PENDING** |
| **Listing Creation** | `/dashboard/listings/new`<br>`POST /api/listings` | Same | Local Storage / DB | S3/Vercel Blob | Local storage / metadata | Submit valid listing form as authenticated provider | Listing record created in DB in DRAFT state | Pending local test | **PENDING** |
| **Listing Publishing / Approval** | `POST /api/listings/[id]/submit` | Same | None (PostgreSQL) | DB Workflow | Local DB state transition | Submit draft listing for admin review | Status transitioned to PENDING_APPROVAL / ACTIVE | Pending local test | **PENDING** |
| **Categories Hierarchy** | `GET /api/categories` | Same | None (PostgreSQL) | Seeded DB categories | Seeded canonical categories in local DB | Query categories API | 200 OK with tree of rental categories | Pending local test | **PENDING** |

---

### 2.3 Bookings, Turnover & Inspection

| Feature | Production Route / API | Local Route / API | External Dependency | Production Config Type | Required Local / Dev Equivalent | Test Procedure | Expected Result | Current Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| **Booking Creation** | `POST /api/bookings` | Same | None (PostgreSQL) | Production DB | `rentipid_local_dev` | Submit booking request for dates | Booking created in PENDING_PAYMENT / PENDING_CONFIRMATION | Pending local test | **PENDING** |
| **Booking Agreement** | `POST /api/bookings/[id]/agreement` | Same | None | DB Agreement terms | Local agreement record | Renter & Provider accept terms | Digital agreement timestamps recorded | Pending local test | **PENDING** |
| **Turnover Inspection (Check-in)** | `POST /api/bookings/[id]/inspection` | Same | Image Storage | Production Blob | Local storage | Provider uploads item condition photos | Inspection record created with photos | Pending local test | **PENDING** |
| **Renter Inspection Confirmation** | `POST /api/bookings/[id]/inspection/renter-confirm` | Same | None | DB state | Local DB state | Renter reviews photos and signs off | Booking status updated to IN_PROGRESS | Pending local test | **PENDING** |
| **Turnover Return (Check-out)** | `POST /api/bookings/[id]/turnover` | Same | Image Storage | Production Blob | Local storage | Provider logs return condition photos | Return inspection created, booking completed | Pending local test | **PENDING** |

---

### 2.4 Payments & Financial Ledger

| Feature | Production Route / API | Local Route / API | External Dependency | Production Config Type | Required Local / Dev Equivalent | Test Procedure | Expected Result | Current Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| **Payment Checkout Initiation** | `/checkout/[bookingId]`<br>`POST /api/payments` | Same | Payment Gateway | PayMongo / Live Gateway | `NEXT_PUBLIC_MOCK_PAYMENTS=true` mock adapter | Renter initiates payment for booking | Mock payment processed, 200 OK | Pending local test | **PENDING** |
| **Finance Ledger Recording** | Internal DB Transaction | Same | None (Prisma) | Production Neon DB | `rentipid_local_dev` (`FinanceLedger`) | Query `FinanceLedger` table post-payment | Double-entry ledger row created with correct amount | Pending local test | **PENDING** |
| **Finance Dashboard Views** | `/dashboard/finance` | Same | None | Production DB | Local finance ledger rows | Load finance dashboard as Admin | Payouts, deposits, and balances displayed | Pending local test | **PENDING** |
| **Payout Readiness Check** | `/dashboard/finance/payout-readiness` | Same | None | DB aggregation | Local DB aggregation | Query payout readiness | Eligible completed bookings listed for payout | Pending local test | **PENDING** |

---

### 2.5 KYC & Document Verification

| Feature | Production Route / API | Local Route / API | External Dependency | Production Config Type | Required Local / Dev Equivalent | Test Procedure | Expected Result | Current Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| **Document Upload** | `POST /api/documents/upload` | Same | File Storage | Vercel Blob / S3 | Local storage / temp upload | Upload government ID / business permit | File saved, document record created | Pending local test | **PENDING** |
| **KYC Submission** | `/dashboard/kyc`<br>`POST /api/documents/verify` | Same | Verification Service / Manual | Admin queue | Local DB status | User submits KYC verification request | User KYC status transitions to PENDING | Pending local test | **PENDING** |
| **Admin KYC Approval** | `POST /api/admin/documents/[id]/approve` | Same | None | Admin RBAC | Local Admin user | Admin approves document in queue | User KYC status transitions to VERIFIED | Pending local test | **PENDING** |

---

### 2.6 AI Customer Service & Mediation

| Feature | Production Route / API | Local Route / API | External Dependency | Production Config Type | Required Local / Dev Equivalent | Test Procedure | Expected Result | Current Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| **AI Help Chatbot** | `POST /api/ai/chat` | Same | Google Gemini / GenAI | Cloud API Key | Dev Gemini API Key / deterministic mock | Send prompt "How do I rent an item?" | Intelligent assistance response returned | Pending local test | **PENDING** |
| **AI Mediation Provider** | `POST /api/ai/mediation/provider` | Same | GenAI | Cloud API Key | Dev AI service | Submit claim details for AI settlement suggestion | Structured mediation recommendation returned | Pending local test | **PENDING** |
| **AI Mediation Renter** | `POST /api/ai/mediation/renter` | Same | GenAI | Cloud API Key | Dev AI service | Submit renter response to claim | Structured compromise proposal generated | Pending local test | **PENDING** |

---

### 2.7 Security Operations (SOC), Compliance & Admin

| Feature | Production Route / API | Local Route / API | External Dependency | Production Config Type | Required Local / Dev Equivalent | Test Procedure | Expected Result | Current Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| **Security Telemetry Logging** | Internal `logSecurityEvent` | Same | None (PostgreSQL) | Production HMAC key | Local HMAC keys | Trigger security-relevant event (login failure) | `SecurityAuditLog` record created with valid hash | Pending local test | **PENDING** |
| **SOC Incident Dashboard** | `/dashboard/admin/security` | Same | None | Admin RBAC | Local `ADMIN` role session | Load SOC security dashboard | 200 OK, event stream and threat levels shown | Pending local test | **PENDING** |
| **Prohibited Items Enforcement** | `/dashboard/compliance/prohibited-items` | Same | None | Compliance RBAC | Local `COMPLIANCE_OFFICER` | Review listing flag against prohibited catalog | Item flagged, policy rule recorded | Pending local test | **PENDING** |
| **RBAC Route Protection** | Middleware / Server components | Same | None | Session RBAC | Local test sessions for Renter/Admin | Attempt to access `/dashboard/admin` as Renter | 403 Forbidden / redirected safely | Pending local test | **PENDING** |

---

### 2.8 System Health & PWA

| Feature | Production Route / API | Local Route / API | External Dependency | Production Config Type | Required Local / Dev Equivalent | Test Procedure | Expected Result | Current Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| **System Health Check** | `GET /api/health` | Same | PostgreSQL connection | Neon Production | `rentipid_local_dev` | HTTP GET `/api/health` | 200 OK `{"status":"ready","database":"connected"}` | Pending local test | **PENDING** |
| **PWA Web Manifest** | `GET /manifest.json` | Same | Static asset | Production manifest | Local static `/public/manifest.json` | HTTP GET `/manifest.json` | Valid JSON with name, icons, start_url, theme_color | Pending local test | **PENDING** |
| **Address Autocomplete (PSGC)** | `GET /api/address/autocomplete` | Same | None (PSGC reference data) | Seeded PSGC | Local seeded PSGC tables | Query Philippine city/barangay autocomplete | 200 OK with matching standard Philippine locations | Pending local test | **PENDING** |
