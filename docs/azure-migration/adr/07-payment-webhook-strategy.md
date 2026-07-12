# ADR 07: Payment Webhook Strategy

## Context
Rentipid is migrating to an Azure backend while maintaining Vercel frontend delivery.

## Decision
PayMongo webhooks will route directly to an Azure endpoint, using idempotency keys to prevent duplicate financial ledgers.

## Security Impact
Enforces protected boundaries between the public internet and backend business logic.

## Financial Impact
Scales to zero (where supported) to minimize idle costs, standard Azure pricing applies.

## Reversibility
Medium. Reverting would require re-pointing DNS and re-architecting Next.js API routes back to serverless functions.