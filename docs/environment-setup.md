# Environment Setup Guide

This document outlines the required environment configuration for running RENTipid in local, staging, and production environments.

## Core Rules
1. **Never expose secrets in the frontend.** Prefix variables with `NEXT_PUBLIC_` ONLY if they strictly need to be bundled into the browser (e.g., Stripe public keys).
2. **Never commit `.env` or `.env.local`.** These files are listed in `.gitignore`.
3. **Never display secrets in the Admin UI.**

## Environment Variables

### 1. Database
- `DATABASE_URL`: Connection string for Prisma.
  - *Local*: `"file:./dev.db"`
  - *Production*: `"postgresql://user:password@host:port/database"`

### 2. Authentication (NextAuth)
- `NEXTAUTH_URL`: The canonical URL of the site (e.g., `https://rentipid.com`).
- `NEXTAUTH_SECRET`: A 32-character random string used to encrypt JWT cookies. Generate via `openssl rand -base64 32`.

### 3. AI Providers
- `GEMINI_API_KEY`: API key for Google GenAI used in the AI Command Layer.

### 4. Storage Providers
- `STORAGE_PROVIDER`: Specifies the active storage adapter (`local`, `s3`, `r2`, `supabase`).
- `STORAGE_BUCKET_NAME`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`: Credentials for cloud storage.

### 5. Social Integrations
- Keys for `FACEBOOK_APP_ID`, `TIKTOK_CLIENT_KEY`, etc., used by the `SocialCommandLayer` when live posting is activated.

## Deployment Checklist
- [ ] Set `NODE_ENV=production`.
- [ ] Ensure `NEXTAUTH_URL` exactly matches the production domain.
- [ ] Ensure database migrations are run safely (`npx prisma migrate deploy` for Postgres).
