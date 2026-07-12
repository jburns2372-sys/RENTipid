# ADR 12: Infrastructure As Code Format

## Context
Rentipid is migrating to an Azure backend while maintaining Vercel frontend delivery.

## Decision
Terraform (HCL) selected for IaC to ensure cloud-agnostic modularity and state consistency for Dev, Staging, and Prod.

## Security Impact
Enforces protected boundaries between the public internet and backend business logic.

## Financial Impact
Scales to zero (where supported) to minimize idle costs, standard Azure pricing applies.

## Reversibility
Medium. Reverting would require re-pointing DNS and re-architecting Next.js API routes back to serverless functions.