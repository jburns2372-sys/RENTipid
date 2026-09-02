# ListingBridge v1.1 Assisted Import Architecture Lock

## Common architecture

All five adapters implement the existing connector interface and share the provider-input processor. The server receives an input reference, validates bounded content, sanitizes data, maps factual values to the frozen canonical contract, records provenance/confidence, and returns the durable import job to the existing review/readiness and draft flow.

`SOURCE_URL` is hashed and retained only as a safe reference. `PASTED_TEXT`, structured file data, and other provider-supplied inputs are the actual ingestion material. Matching a known platform URL never creates an HTTP request.

## Connector registry

The registry contains exactly these v1.1 IDs:

| Connector | Display name | Mode |
| --- | --- | --- |
| `airbnb.assisted.v1` | Airbnb | Provider-assisted |
| `booking.com.assisted.v1` | Booking.com | Provider-assisted |
| `agoda.assisted.v1` | Agoda | Provider-assisted |
| `facebook.marketplace.assisted.v1` | Facebook Marketplace | Provider-assisted |
| `external.listing.assisted.v1` | Other Listing Platform | Generic assisted |

Every descriptor declares assisted import, requires provider input and rights confirmation, uses no third-party credentials/session, and has automated external fetch disabled. All are fail-closed for Preview/Production and remain disabled until later v1.1 lifecycle gates.

## Authorities and controls

Authentication/RBAC, server-side provider re-resolution, ListingBridge durable repositories, canonical normalization, field correction, media security, location/duplicate intelligence, audit, feature control, readiness, and `ListingService.createDraft` are inherited from v1.0. Assisted adapters cannot write `Listing` directly or publish.

AI remains bounded and optional: it may assist factual extraction or semantic mapping but cannot fabricate, decide rights, obey pasted instructions, mutate the database, bypass controls, or publish. Core provider text/file import remains deterministic with AI disabled.

## Network isolation

`fetchListing()` rejects assisted source URLs with `ASSISTED_IMPORT_REQUIRES_PROVIDER_DATA`; ingestion operates on provider-supplied content only. The tests assert known platform references and generic references do not invoke external retrieval.

## Schema and lifecycle

No Prisma model or migration is added. This phase evaluates G1 Code Complete only. G2 Local Functional and all later gates remain pending and must be independently evidenced.
