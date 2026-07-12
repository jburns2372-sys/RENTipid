# ADR 10: Emergency Freeze Enforcement

## Context
Rentipid is migrating to an Azure backend while maintaining Vercel frontend delivery.

## Decision
Emergency freeze state will be a fast-read centralized flag in the database that short-circuits any financial POST request.

## Security Impact
Enforces protected boundaries between the public internet and backend business logic.

## Financial Impact
Scales to zero (where supported) to minimize idle costs, standard Azure pricing applies.

## Reversibility
Medium. Reverting would require re-pointing DNS and re-architecting Next.js API routes back to serverless functions.