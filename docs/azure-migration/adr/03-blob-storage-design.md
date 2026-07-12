# ADR 03: Blob Storage Design

## Context
Rentipid is migrating to an Azure backend while maintaining Vercel frontend delivery.

## Decision
Using Azure Blob Storage with private containers and SAS tokens for secure KYC and listing image storage.

## Security Impact
Enforces protected boundaries between the public internet and backend business logic.

## Financial Impact
Scales to zero (where supported) to minimize idle costs, standard Azure pricing applies.

## Reversibility
Medium. Reverting would require re-pointing DNS and re-architecting Next.js API routes back to serverless functions.