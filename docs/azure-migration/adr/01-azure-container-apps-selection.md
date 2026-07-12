# ADR 01: Azure Container Apps Selection

## Context
Rentipid is migrating to an Azure backend while maintaining Vercel frontend delivery.

## Decision
Azure Container Apps selected for serverless scaling, vnet integration, and native docker compatibility without k8s overhead.

## Security Impact
Enforces protected boundaries between the public internet and backend business logic.

## Financial Impact
Scales to zero (where supported) to minimize idle costs, standard Azure pricing applies.

## Reversibility
Medium. Reverting would require re-pointing DNS and re-architecting Next.js API routes back to serverless functions.