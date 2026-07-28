# Payment Environment Scope Security Review

## Review Boundary

Only variable names and deployment scopes were in scope. No values were retrieved or changed, and no payment operation was executed.

## Findings

| Variable | Production presence | Preview presence | Risk determination |
|---|---|---|---|
| `PAYMONGO_WEBHOOK_SECRET_LIVE` | Confirmed by owner inventory | UNRESOLVED — Vercel CLI not installed | Live secret must be Production-only |
| `PAYMONGO_SECRET_KEY_LIVE` | Confirmed by owner inventory | UNRESOLVED — Vercel CLI not installed | Critical if exposed to Preview; Production-only required |
| `PAYMONGO_PUBLIC_KEY_LIVE` | Confirmed by owner inventory | UNRESOLVED — Vercel CLI not installed | Keep aligned with the explicitly authorized live environment |
| `PAYMENT_LIVE_MODE` | Confirmed by owner inventory | UNRESOLVED — Vercel CLI not installed | Must remain disabled outside an explicitly authorized live pilot |
| `PAYMONGO_LIVE_ENABLED` | Confirmed by owner inventory | UNRESOLVED — Vercel CLI not installed | Must remain disabled outside an explicitly authorized live pilot |
| `PAYMENT_PROVIDER_MODE` | Confirmed by owner inventory | UNRESOLVED — Vercel CLI not installed | Preview must resolve to sandbox/non-live behavior |

## Required Scope Policy

- Live PayMongo secret keys and live webhook secrets must be scoped to Production only.
- Preview must use distinct sandbox credentials and sandbox webhooks.
- `PAYMENT_LIVE_MODE` must remain disabled in Preview, Development, and Production except during a separately approved PHASE 19 live-pilot window.
- `PAYMONGO_LIVE_ENABLED` must remain disabled in Preview, Development, and Production except during that same approved window.
- A public live key does not justify enabling live mode.
- Scope verification must be performed from sanitized Vercel metadata before PHASE 19 authorization.

## Current Risk

**PayMongo Preview-scope risk: UNRESOLVED.** Owner facts confirm the variable names exist in Vercel but do not establish their scopes, and the Vercel CLI was not installed for independent metadata inspection. No Vercel variable was modified.

