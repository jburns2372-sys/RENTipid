# ADR 13: Region Selection

## Context
Rentipid is migrating to an Azure backend while maintaining Vercel frontend delivery.

## Decision
Azure Southeast Asia (Singapore) selected to minimize latency for PayMongo and the expected user base.

## Security Impact
Enforces protected boundaries between the public internet and backend business logic.

## Financial Impact
Scales to zero (where supported) to minimize idle costs, standard Azure pricing applies.

## Reversibility
Medium. Reverting would require re-pointing DNS and re-architecting Next.js API routes back to serverless functions.