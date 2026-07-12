# ADR 14: Disaster Recovery

## Context
Rentipid is migrating to an Azure backend while maintaining Vercel frontend delivery.

## Decision
Configuring Geo-redundant backups for PostgreSQL and Blob Storage, targeting a secondary region for catastrophic failover.

## Security Impact
Enforces protected boundaries between the public internet and backend business logic.

## Financial Impact
Scales to zero (where supported) to minimize idle costs, standard Azure pricing applies.

## Reversibility
Medium. Reverting would require re-pointing DNS and re-architecting Next.js API routes back to serverless functions.