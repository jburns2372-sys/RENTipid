# Payment Environment Scope Security Review

## Confirmed Scope

The owner confirmed that the following variable names are present in both Preview and Production:

- `PAYMONGO_LIVE_ENABLED`
- `PAYMONGO_WEBHOOK_SECRET_LIVE`
- `PAYMONGO_SECRET_KEY_LIVE`
- `PAYMONGO_PUBLIC_KEY_LIVE`
- `PAYMENT_LIVE_MODE`
- `PAYMENT_PROVIDER_MODE`

Only names and scopes are recorded. No value was retrieved or changed, and no payment operation was executed.

## Risk Review

| Variable | Preview | Production | Security determination |
|---|---|---|---|
| `PAYMONGO_WEBHOOK_SECRET_LIVE` | Confirmed present | Confirmed present | Live webhook secrets should normally be Production-only |
| `PAYMONGO_SECRET_KEY_LIVE` | Confirmed present | Confirmed present | Live secret keys should normally be Production-only |
| `PAYMONGO_PUBLIC_KEY_LIVE` | Confirmed present | Confirmed present | Must remain aligned with the explicitly authorized environment |
| `PAYMENT_LIVE_MODE` | Confirmed present | Confirmed present | Preview must remain non-live; Production requires separate PHASE 19 authorization |
| `PAYMONGO_LIVE_ENABLED` | Confirmed present | Confirmed present | Preview must remain disabled; Production requires separate PHASE 19 authorization |
| `PAYMENT_PROVIDER_MODE` | Confirmed present | Confirmed present | Preview must select sandbox behavior |

## Required Scope Policy

- Remove live PayMongo secret material from Preview unless a documented exception is approved.
- Scope live PayMongo secret keys and live webhook secrets to Production only under normal operations.
- Configure Preview with distinct sandbox credentials, sandbox webhooks, and non-live mode.
- Keep `PAYMENT_LIVE_MODE` and `PAYMONGO_LIVE_ENABLED` disabled outside a separately authorized PHASE 19 live-pilot window.
- Do not infer safe values from variable names or scopes; confirm configuration without displaying values before PHASE 19.

## Current Risk

**PayMongo Preview-scope risk: RECORDED - REMEDIATION REQUIRED.** Live PayMongo variable names, including secret names, are confirmed in Preview. This governance correction does not retrieve, rotate, remove, or modify any Vercel variable.
