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

## Slice 1 Preview and Frozen Baseline (2026-08-12)

- Preview database migration status: PASS; 38 repository migrations, schema up to date.
- Latest migration: 20260812000000_add_insurance_foundation.
- Preview schema access: PASS for InsurancePartner, InsuranceProduct,
  InsuranceOffer, InsurancePolicy, InsuranceClaim and InsuranceWebhookEvent.
- Preview record counts: 0 for all six Slice 1 models.
- Insurance seed/sync: NOT REQUIRED - VERIFIED.
- Frozen schema baseline: 2ff068991950de64e3bf0931ed76a5650217dbe2.

## Transaction Block Schema and Data (2026-08-12)

- Migration: 20260812010000_add_insurance_transaction_block.
- Local state: APPLIED; 39 migrations; schema up to date.
- InsuranceSelection stores immutable consent and presented-offer evidence with
  one selection per Booking and deterministic idempotency.
- InsuranceOrder stores payment-dependency and issuance lifecycle with one
  order per selection/Booking and separate issuance idempotency.
- InsurancePolicy has an additive optional unique insurance_order_id relation.
- Required local data: one guarded mock partner and one MOCK-FOUNDATION product,
  explicitly LOCAL, MOCK_LOCAL_ONLY, non-production and not real insurance.
- Runtime records after acceptance: selections 0, orders 0, offers 0, policies
  0, claims 0 and webhook events 0.
