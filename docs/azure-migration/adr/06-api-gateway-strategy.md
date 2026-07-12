# ADR 06: API Gateway Strategy

## Context
Rentipid is migrating to an Azure backend while maintaining Vercel frontend delivery.

## Decision
Using Azure API Management (APIM) as a unified entry point to enforce rate-limiting, WAF rules, and routing.

## Security Impact
Enforces protected boundaries between the public internet and backend business logic.

## Financial Impact
Scales to zero (where supported) to minimize idle costs, standard Azure pricing applies.

## Reversibility
Medium. Reverting would require re-pointing DNS and re-architecting Next.js API routes back to serverless functions.