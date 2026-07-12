# ADR 11: Monitoring Strategy

## Context
Rentipid is migrating to an Azure backend while maintaining Vercel frontend delivery.

## Decision
Implementing Azure Application Insights and Log Analytics, correlating frontend requests to backend operations using x-correlation-id headers.

## Security Impact
Enforces protected boundaries between the public internet and backend business logic.

## Financial Impact
Scales to zero (where supported) to minimize idle costs, standard Azure pricing applies.

## Reversibility
Medium. Reverting would require re-pointing DNS and re-architecting Next.js API routes back to serverless functions.