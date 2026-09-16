# RENTipid — Configuration Baseline (Non-Secret)

**Release:** `rentipid-successor-2026-09-v1.0.0-frozen`  
**Production Deployment:** `dpl_6CAZBAdohAhBJKhBvaNs26AHfzgW`  
**Governance Standard:** Zero Plaintext Secrets in Repositories or Documentation  

---

## 1. Production Runtime Environment Inventory

The following environment variables are configured on the Vercel Production deployment for project `prj_DiF8jBz51kFIHK74udSP6zuqBtMr`. In compliance with security policy, secret values are omitted; only variable names, purpose, and presence status are documented:

| Variable Name | Environment | Status | Purpose | Sensitivity Category |
|---|---|---|---|---|
| `DATABASE_URL` | Production | Present | Neon PostgreSQL production connection pool | Secret (Encrypted in Vercel) |
| `DIRECT_URL` | Production | Present | Neon direct database connection string for migrations | Secret (Encrypted in Vercel) |
| `NEXTAUTH_SECRET` | Production | Present | NextAuth JWT signing and session encryption | Secret (Encrypted in Vercel) |
| `NEXTAUTH_URL` | Production | Present | Base URL for auth callbacks (`https://www.rentipid.com.ph`) | Public Configuration |
| `BLOB_READ_WRITE_TOKEN` | Production | Present | Vercel Blob storage access token for media uploads | Secret (Encrypted in Vercel) |
| `OPENAI_API_KEY` | Production | Present | LLM intelligence backend for Unified AI and RAG | Secret (Encrypted in Vercel) |
| `EMAIL_SERVER_HOST` | Production | Present | SMTP relay host for verification & notification emails | Configuration |
| `EMAIL_SERVER_PORT` | Production | Present | SMTP relay port (typically 587 or 465) | Configuration |
| `EMAIL_SERVER_USER` | Production | Present | SMTP relay username | Configuration |
| `EMAIL_SERVER_PASSWORD` | Production | Present | SMTP relay password | Secret (Encrypted in Vercel) |
| `EMAIL_FROM` | Production | Present | Sender address for outbound system emails | Configuration |
| `GOOGLE_CLIENT_ID` | Production | Present | Google OAuth client ID | Configuration |
| `GOOGLE_CLIENT_SECRET` | Production | Present | Google OAuth client secret | Secret (Encrypted in Vercel) |

---

## 2. Feature-Flag Baseline (SystemSettings)

The following operational flags are established in the production database configuration:

| Setting Key | Configured State | Effect |
|---|---|---|
| `LISTINGBRIDGE_GLOBAL` | `false` | Permanently disables ListingBridge across all personas |
| `LISTINGBRIDGE_URL_IMPORT` | `false` | URL import disabled |
| `LISTINGBRIDGE_API_CONNECTORS` | `false` | OTA API connectors disabled |
| `LISTINGBRIDGE_MEDIA_IMPORT` | `false` | OTA media scraping disabled |
| `LISTINGBRIDGE_AI_MAPPING` | `false` | AI automated import mapping disabled |
| `UNIFIED_AI_ENABLED` | `true` | Enables AI Concierge and suggestions |
| `PROHIBITED_ITEMS_ENFORCEMENT` | `true` | Enforces active compliance catalog check |
| `REGISTRATION_OPEN` | `true` | Permits renter and provider onboarding |
