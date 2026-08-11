# R4 — PARTNER CAPABILITY REGISTRY

Normalized capabilities required from an insurance adapter. Do not hard-code Igloo, Etiqa, or any specific provider into core domain logic.

| Capability | Description | Mock Adapter Requirement | Real Partner Requirement |
|---|---|---|---|
| `checkEligibility` | Validates if a booking qualifies for coverage | Returns deterministic true/false based on listing data | Calls external API to verify eligibility |
| `getOffers` | Retrieves quotes/pricing for eligible bookings | Returns deterministic mock quotes | Calls external API for live quotes |
| `createOrder` | Initiates policy purchase | Simulates order creation and returns mock ID | Calls external API to issue policy |
| `getPolicy` | Retrieves active policy details | Returns mock policy details | Calls external API to sync policy state |
| `cancelPolicy` | Cancels an active policy | Simulates cancellation | Calls external API to cancel and trigger refund |
| `createClaim` | Submits a new claim with evidence | Simulates claim submission | Calls external API to register claim |
| `getClaim` | Retrieves claim status | Returns deterministic claim status | Calls external API to check claim |
| `verifyWebhook` | Validates partner webhook signatures | Validates mock test signature | Validates HMAC/RSA signature from provider |
| `reconcile` | Supports financial reconciliation | Returns mock ledger reconciliation | Calls external API for ledger sync |
| `getCapabilities` | Returns supported capabilities of this adapter | Returns full mock support | Returns provider-specific support map |
| `healthCheck` | Validates adapter connectivity | Returns OK | Pings external partner health endpoint |

## Slice 1 Implementation Status (2026-08-12)

- The normalized `PartnerAdapter` interface implements all eleven capability signatures.
- `PartnerAdapterRegistry` provides deterministic registration/resolution, explicit missing-adapter failure, same-instance idempotency and duplicate replacement rejection.
- `MockInsuranceAdapter` implements all eleven capabilities with deterministic IDs, timestamps, fixtures and failure scenarios.
- No network client, credential, partner name, partner schema or provider-specific branch exists in normalized core code.
- Real partner adapters remain NOT STARTED / BLOCKED-EXTERNAL.
