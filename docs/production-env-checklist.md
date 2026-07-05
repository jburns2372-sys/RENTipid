# RENTipid Production Environment Checklist

Before deploying to the production server (e.g., Vercel, AWS), ensure the following environment variables are securely configured in your production environment settings. 

**CRITICAL WARNING:** NEVER commit production secrets to Git.

## Core Application
- [ ] `APP_BASE_URL` (Must be your exact `https://` production domain)
- [ ] `NEXTAUTH_URL` (Must exactly match `APP_BASE_URL` if using NextAuth)
- [ ] `NEXTAUTH_SECRET` (Must be a secure 32+ character random string)

## Database
- [ ] `DATABASE_URL` (Production database connection string with secure credentials)

## Payment Gateway (PayMongo)
- [ ] `PAYMENT_PROVIDER_MODE` (Set to `paymongo_live_pilot` for initial pilot, then `paymongo_live`)
- [ ] `PAYMENT_LIVE_MODE` (Set to `true`)
- [ ] `PAYMONGO_LIVE_ENABLED` (Set to `true`)
- [ ] `PAYMONGO_PUBLIC_KEY_LIVE` (Your `pk_live_...` key)
- [ ] `PAYMONGO_SECRET_KEY_LIVE` (Your `sk_live_...` key)
- [ ] `PAYMONGO_WEBHOOK_SECRET_LIVE` (Your `whsec_live_...` key from the webhook dashboard)

## Email & SMS (If Applicable)
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASS`
- [ ] `SMS_API_KEY`

## Storage
- [ ] `AWS_S3_BUCKET` (or chosen provider)
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`

## Deployment Validation
Once deployed, verify readiness by checking:
`https://[YOUR_DOMAIN]/dashboard/super-admin/production-domain-readiness`
