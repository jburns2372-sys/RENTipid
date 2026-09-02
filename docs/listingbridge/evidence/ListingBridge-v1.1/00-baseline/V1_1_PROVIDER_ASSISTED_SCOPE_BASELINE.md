# ListingBridge v1.1 Provider-Assisted Scope Baseline

Parent: ListingBridge v1.0, frozen tag `listingbridge-v1.0.0-frozen`, application SHA `a8647df71aa9c610027054e2016fd73b53f3b238`.

## In scope

Five provider-assisted source adapters are in scope: `airbnb.assisted.v1`, `booking.com.assisted.v1`, `agoda.assisted.v1`, `facebook.marketplace.assisted.v1`, and `external.listing.assisted.v1`. An authenticated Provider supplies authorized text, structured data, supported documents, screenshots, source references, and/or provider-owned media. The same ListingBridge canonical pipeline, provenance, confidence, review, rights confirmation, duplicate controls, durable jobs, and native draft authority are reused.

The source URL is a provenance reference only. Assisted adapters do not retrieve third-party pages, authenticate to platforms, scrape, capture credentials/cookies/sessions, or require API/partner approval.

## Input capability posture

Provider text and structured JSON/CSV/XML processing are implemented with bounded parsing and XML entity rejection. PDF/document and screenshot bytes use the existing secure input boundary; this phase does not claim a new OCR or document-understanding runtime. Provider-owned media remains subject to existing MIME, size, decode, hashing, deduplication, storage, and provenance controls.

## Explicit exclusions

Airbnb direct API, Booking.com direct API, Agoda direct API, Facebook direct API, OTA scraping, automated login, third-party credential storage, continuous synchronization, reservation sync, pricing write-back, and automatic publication are out of scope.

`SCHEMA_CHANGE=NO`; `MIGRATION_CHANGE=NO`. Existing `ListingImportJob`, `ListingImportSource`, `ListingImportField`, `ListingImportAsset`, `ListingImportResolution`, and `ListingImportAuditEvent` remain the durable representation.
