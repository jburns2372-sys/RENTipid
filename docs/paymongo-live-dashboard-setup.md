# PayMongo Live Dashboard Setup Guide

To successfully receive real-time webhook updates for live payments, you must configure your PayMongo Live Merchant Dashboard.

## 1. Account Activation Readiness
Before attempting any Live Pilot testing, confirm that your PayMongo Live Account has been fully approved by their KYC team.
Ensure that **GCash, PayMaya, and Card** payment methods are toggled **ON** in your dashboard settings.

## 2. API Keys
Navigate to the **Developers -> API Keys** section.
Copy your Live Keys (`pk_live_...` and `sk_live_...`). These must be placed into your production `.env` variables exactly as `PAYMONGO_PUBLIC_KEY_LIVE` and `PAYMONGO_SECRET_KEY_LIVE`.

## 3. Webhook Registration
Navigate to the **Developers -> Webhooks** section.
1. Click **Create Webhook**.
2. **Webhook URL**: You MUST provide your public HTTPS deployment URL.
   - Format: `https://[YOUR_PRODUCTION_DOMAIN]/api/webhooks/paymongo`
   - **IMPORTANT**: Do NOT use `localhost` or `http://`. PayMongo will reject it or silently fail.
3. Select the events you want to listen to (e.g., `payment.paid`, `payment.failed`, `checkout_session.payment.paid`).
4. Save the Webhook.
5. PayMongo will generate a **Webhook Secret** (`whsec_live_...`). Copy this and set it as `PAYMONGO_WEBHOOK_SECRET_LIVE` in your production environment.

## 4. Final Reminders
- Only test with a single, low-value transaction first (e.g., ₱100) to ensure the full end-to-end flow works.
- Check the RENTipid `/api/webhooks/paymongo/health` route after deployment to verify your server is ready to receive events.
