# Production Payment Environment Setup

**Phase 16 - Limited Live Pilot Readiness**

## Required Production Variables

To support the Limited Live Pilot, the following variables must be added to the production environment (e.g., Vercel, AWS):

```env
# Global Toggle for Live Mode (Must be explicitly matched)
PAYMENT_PROVIDER_MODE=paymongo_live_pilot
PAYMENT_LIVE_MODE=false # Default to false, explicitly enable via UI

# Live Keys (Strictly Server-Side)
PAYMONGO_PUBLIC_KEY_LIVE=pk_live_xxxx
PAYMONGO_SECRET_KEY_LIVE=sk_live_xxxx
PAYMONGO_WEBHOOK_SECRET_LIVE=wh_live_xxxx

# App Configuration
APP_BASE_URL=https://rentipid.com # Production webhook URL must use HTTPS
```

## Security Rules
1. **Never** expose `sk_live_` keys in the UI or client-side components.
2. Live pilot transactions are completely segregated from Sandbox testing.
3. Live mode is gated by the `SystemSetting` `PAYMENT_LIVE_PILOT_ENABLED` requiring explicit Super Admin confirmation.
