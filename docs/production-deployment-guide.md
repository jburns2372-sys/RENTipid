# RENTipid Production Deployment Guide

Follow these steps to deploy the RENTipid Phase 19B-B architecture to a production environment (e.g., Vercel, AWS).

## 1. Environment Preparation
- Ensure you have read `docs/production-env-checklist.md`.
- Enter all required environment variables securely into your hosting provider's dashboard (e.g., Vercel Environment Variables settings).
- **Verify HTTPS Domain**: Ensure your `APP_BASE_URL` exactly matches your deployed domain (e.g., `https://rentipid.com`).

## 2. Deployment
- Deploy the application via Git push or CLI (`vercel --prod`).
- Wait for the build process to complete.

## 3. Post-Deployment Checks
After a successful build:
1. Run a database integrity check (e.g., `npx prisma db pull` or `npx prisma migrate status`).
2. Visit `https://[YOUR_DOMAIN]/api/webhooks/paymongo/health` and verify it returns `status: ok` and `is_production_https: true`.
3. Open the **Production Domain Readiness Dashboard**:
   `https://[YOUR_DOMAIN]/dashboard/super-admin/production-domain-readiness`
   Confirm all checklist items are marked Passed/Configured.
4. Open the **PayMongo Activation Dashboard**:
   `https://[YOUR_DOMAIN]/dashboard/super-admin/paymongo-activation`
   Confirm the final status card shows "Ready for First Live Transaction".

## 4. Final Live Test Execution
Once all dashboards are green:
- The Super Admin can proceed to the selected Booking Checkout.
- The strict pre-flight locks will unlock, permitting the Live PayMongo Checkout option.
- Execute the low-value real money transaction.
- Check the Live Webhook Monitor to ensure the webhook successfully hits your production domain!
