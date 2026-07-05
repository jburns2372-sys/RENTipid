# AWS Production Environment Variables

This document outlines the required environment variables for deploying RENTipid to an AWS production environment.

**CRITICAL RULE: NEVER commit `.env.production` to version control.**

## Required Variables

```env
NODE_ENV=production
APP_BASE_URL=https://your-production-domain.com
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET= # MUST be a strongly generated random string (e.g. openssl rand -base64 32)
DATABASE_URL= # Your RDS or local PostgreSQL connection string
```

## Payment Guardrails

```env
PAYMENT_PROVIDER_MODE=mock
PAYMENT_LIVE_MODE=false
```
**CRITICAL:** These must remain at `mock` and `false` until Phase 19B PayMongo approval is complete.

## PayMongo Live Keys

```env
PAYMONGO_PUBLIC_KEY_LIVE=
PAYMONGO_SECRET_KEY_LIVE=
PAYMONGO_WEBHOOK_SECRET_LIVE=
PAYMONGO_LIVE_ENABLED=false
```
**CRITICAL:** Do NOT set `PAYMONGO_LIVE_ENABLED=true` until you are explicitly instructed to do so by the Phase 19B runbook.

## Email Configuration

```env
EMAIL_PROVIDER=
EMAIL_FROM=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
```

## Storage Configuration

```env
STORAGE_PROVIDER=local
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
```
*Note: In the initial EC2 deployment, `local` is acceptable. Migration to `s3` is required for high availability.*
