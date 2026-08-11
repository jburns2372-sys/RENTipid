# R6 — DATA MODEL REGISTRY

Reconciliation of proposed models against the existing database registry. Do NOT create duplicate equivalents.

| Proposed Model | Resolution | Existing/New Counterpart |
|---|---|---|
| `InsurancePartner` | NEW | Create new `InsurancePartner` model |
| `InsuranceProduct` | NEW | Create new `InsuranceProduct` model |
| `InsuranceOffer` | NEW | Create new `InsuranceOffer` model |
| `InsuranceSelection` | EXTEND EXISTING | Link to `Booking` or create `InsuranceSelection` linked to `Booking` |
| `InsurancePolicy` | NEW | Create new `InsurancePolicy` model |
| `InsuranceClaim` | NEW | Create new `InsuranceClaim` model |
| `InsuranceClaimEvidence` | EXTEND EXISTING | Use `Media` model or create `InsuranceClaimEvidence` linked to `Media` |
| `InsuranceLedgerEntry` | EXTEND EXISTING | Extend `Transaction` / Ledger model |
| `InsuranceWebhookEvent` | NEW | Create new `InsuranceWebhookEvent` for idempotency |
| `InsuranceAuditEvent` | EXTEND EXISTING | Extend `SecurityEvent` or `AuditLog` |

## Slice 1 Schema Reconciliation (2026-08-12)

| Model | Slice 1 status | Decision |
|---|---|---|
| `InsurancePartner` | LOCAL DATABASE MIGRATED | NEW; configuration/capability metadata only, never credentials |
| `InsuranceProduct` | LOCAL DATABASE MIGRATED | NEW; normalized product/configuration foundation |
| `InsuranceOffer` | LOCAL DATABASE MIGRATED | NEW; normalized booking-linked quote foundation |
| `InsurancePolicy` | LOCAL DATABASE MIGRATED | NEW; booking uniqueness and idempotency foundations |
| `InsuranceClaim` | LOCAL DATABASE MIGRATED | NEW; policy-linked claim foundation without evidence duplication |
| `InsuranceWebhookEvent` | LOCAL DATABASE MIGRATED | NEW; body hash, signature result and event-id idempotency foundation |
| `InsuranceSelection` | DEFERRED | No duplicate model; Booking integration remains blocked |
| `InsuranceClaimEvidence` | DEFERRED | Existing media/storage boundary will be referenced later |
| `InsuranceLedgerEntry` | DEFERRED | Existing FinanceLedger/payment boundary remains unchanged |
| `InsuranceAuditEvent` | INTERFACE COMPLETE / PERSISTENCE DEFERRED | Domain audit sink will reuse existing audit/security infrastructure |

Migration: `20260812000000_add_insurance_foundation`.
Status: APPLIED TO CONFIRMED LOCAL DATABASE / SCHEMA VERIFIED / PRISMA CLIENT SYNCHRONIZED / READ-ONLY MODEL ACCESS PASS.
Migration `20260811000002_add_password_recovery` was not altered.

## Slice 1 Required-Data Classification (2026-08-12)

| Model | Classification | Gate 4 decision |
|---|---|---|
| `InsurancePartner` | NOT-REQUIRED-FOR-SLICE-1 | Mock adapter registration and selection are code/environment based; future real-partner rows are external-activation data |
| `InsuranceProduct` | NOT-REQUIRED-FOR-SLICE-1 | Mock offers use a deterministic fixture code; future approved product rows are external-activation data |
| `InsuranceOffer` | RUNTIME-GENERATED | Never seed offers |
| `InsurancePolicy` | RUNTIME-GENERATED | Never seed policies |
| `InsuranceClaim` | RUNTIME-GENERATED | Never seed claims |
| `InsuranceWebhookEvent` | RUNTIME-GENERATED | Never seed webhook events |

LOCAL REQUIRED DATA SEED/SYNC: NOT REQUIRED — VERIFIED.
Database business-data writes: 0.
