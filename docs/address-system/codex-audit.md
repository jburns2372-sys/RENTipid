# RENTipid Global Address System — Codex Audit

## Audit Metadata

- **Audit Date:** 2026-08-09
- **Audit Type:** Focused reconstruction audit. These findings are newly established from the current repository state and are not claimed to be identical to the lost prior audit.
- **Audit Scope:** Global Address System implementation files identified by the Address discovery, plan, implementation report, and Codex review package; directly related Prisma schema/migrations, legacy migration script, environment examples, Profile integration, dependencies, and tests.
- **Git Commit / HEAD:** `e57ee87bd06f4b19bc5de5eec41773f4d383bca5`
- **Source State:** The Address implementation is uncommitted in a heavily dirty worktree. Recent scoped Git history contains no commit that introduces the Global Address System.
- **Database Access:** No database contents were read or modified. The database used by the historical `migrate dev`, `db push`, `db push --accept-data-loss`, and legacy migration commands cannot be identified from retained evidence.

## Files Reviewed

1. `docs/address-system/CODEX-REVIEW.md`
2. `docs/address-system/address-discovery.md`
3. `docs/address-system/address-implementation-plan.md`
4. `docs/address-system/address-implementation-report.md`
5. `.env.example`
6. `.env.production.example`
7. `package.json`
8. `package-lock.json`
9. `prisma/schema.prisma`
10. `prisma/migrations/20260715145648_init_soc_events/migration.sql`
11. `prisma/migrations/20260727011311_phase5f_profile_encryption_companion_fields/migration.sql`
12. `scripts/migrate-legacy-addresses.ts`
13. `src/lib/address/types.ts`
14. `src/lib/address/countryRegistry.ts`
15. `src/lib/address/normalizer.ts`
16. `src/lib/address/AddressService.ts`
17. `src/lib/address/providers/google.ts`
18. `src/components/address/CountrySelect.tsx`
19. `src/components/address/AddressAutocomplete.tsx`
20. `src/components/address/AddressForm.tsx`
21. `src/app/api/address/autocomplete/route.ts`
22. `src/app/api/address/details/route.ts`
23. `src/app/dashboard/profile/page.tsx`
24. `src/components/profile/ProfileFormClient.tsx`
25. `src/app/api/profile/route.ts`
26. `src/lib/security/crypto/profile-field-protection.ts`
27. `src/lib/security/crypto/secret-envelope.ts`

The Prisma migrations directory was enumerated and searched only for Address/Profile schema operations. The test tree was searched only for Address and Profile coverage.

## Commands Run

- `git status --short`
- Scoped `git diff`, `git diff --stat`, and `git log` for the documented Address files
- Read-only searches of `prisma/migrations/`, Address/Profile source, environment examples, dependency use, logging, and directly related tests
- `npx prisma validate`
- `npx prisma generate`
- `npx tsc --noEmit`
- ESLint restricted to the Address implementation, Profile integration, and migration script
- `npm run build`
- `npx prisma migrate diff --help` only, to confirm that migrate-diff is read-only; no schema diff using a live or shadow database was run
- Read-only validation of the installed `world-countries` dataset
- Current official Google Places documentation review for Autocomplete (New), Place Details (New), place types, field masks, and session tokens

No `db push`, migration reset/dev/deploy, seed, legacy migration, or other database-changing command was run.

## Historical Database Command Reconciliation

The supplied implementation history states that the following were executed:

1. `npx prisma migrate dev --name global_address_system`
2. `npx prisma db push`
3. `npx prisma db push --accept-data-loss`
4. `npx prisma generate`
5. `npx tsx scripts/migrate-legacy-addresses.ts`

Current repository evidence shows no `global_address_system` migration under `prisma/migrations/`, so `migrate dev` did not leave an authoritative migration. The current Address table, relation columns, unique indexes, and foreign keys therefore cannot be produced by `prisma migrate deploy` from this repository.

The output from the historical `db push --accept-data-loss` command was not retained. Consequently, the exact destructive operations Prisma warned about, the database target, and whether rows or columns were actually removed cannot be reconstructed safely. Success of `db push` is not migration-safety evidence.

There is also no retained execution record with legacy migration counters or database identifiers. The effect of the stated `npx tsx scripts/migrate-legacy-addresses.ts` run is **UNKNOWN**. Static inspection additionally shows that its import chain reaches `secret-envelope.ts`, which imports `server-only`; the implementation package itself previously recorded that this blocked CLI execution.

## Quality Gates

| Gate | Result | Evidence |
|------|--------|----------|
| Prisma Validate | PASS | `npx prisma validate` reported the current schema valid. |
| Prisma Generate | PASS | Prisma Client v6.19.3 generated successfully. |
| Migration Safety | FAIL | No Address migration exists; production `migrate deploy` cannot create the feature schema, and historical `--accept-data-loss` output is missing. |
| Legacy Data Preservation | UNKNOWN | Legacy columns remain in the current schema, but the migration run/database/effect is unverified and the script has atomicity and country-preservation gaps. |
| Address Unit Tests | NO TEST | No tests reference the registry, normalizer, provider, AddressService, or Address components. |
| Profile Integration Tests | NO TEST | Existing Profile protection tests do not exercise `global_address`, `global_business_address`, or the new Profile API persistence path. |
| International Address Tests | NO TEST | No PH/US/CA/GB/AU/SG/JP normalization or persistence tests exist. |
| Manual Fallback Tests | NO TEST | No manual-mode state or persistence test exists. |
| Country Change Tests | NO TEST | No country-change clearing/confirmation test exists. |
| TypeScript | FAIL | Repository command fails on missing `@axe-core/playwright` types in an unrelated Privacy E2E file. No Address TypeScript diagnostic was emitted before that failure. |
| Changed-file Lint | FAIL | 27 errors and two warnings across the scoped Address/Profile files. |
| Targeted E2E | NO TEST | No Global Address System E2E exists. |
| Production Build | FAIL | Build reaches Next.js compilation, then fails in an unrelated SOC simulations Server Action file. Address production compilation therefore remains unproven. |
| Browser Verification | NOT VERIFIED | No browser session was run and no retained browser evidence exists. |
| API Key Security | PASS | The key is read only from `process.env.GOOGLE_MAPS_API_KEY` inside the server-side Google adapter; no `NEXT_PUBLIC_` key or key-bearing response was found. |
| PII Protection | FAIL | Canonical addresses/coordinates are stored in cleartext; autocomplete text is sent in URLs; raw provider/server errors are logged. |
| Rate/Cost Protection | FAIL | No server rate limiter, maximum lengths, duplicate suppression, cancellation, latest-request-wins, or UI-managed Google session token exists. |
| Provider Abstraction | PASS | UI and Profile persistence consume `NormalizedAddress`; raw Google response mapping remains in the adapter. |

### Test Evidence by Requested Area

| Area | Result | Evidence |
|------|--------|----------|
| Country registry | NO TEST | No test reference found. Read-only dataset inspection found 250 entries and zero duplicate alpha-2 codes. |
| Normalization | NO TEST | No test reference found. |
| Google provider mapping | NO TEST | No mock/fixture or live adapter test exists. |
| International addresses | NO TEST | No representative-country tests exist. |
| Manual fallback | NO TEST | No component or persistence test exists. |
| Country change | NO TEST | No confirmation/clearing test exists. |
| Profile persistence | NO TEST | No test exercises normalized personal or business address save/reload. |
| Legacy migration | NO TEST | No dry-run, idempotency, failure, or preservation test exists. |
| Targeted E2E | NO TEST | No Address E2E file exists. |

## Findings

## P0 Findings

None.

## P1 Findings

### GAS-P1-001 — No deployable Address migration; historical destructive push is unauditable

- **SEVERITY:** P1 — HIGH
- **FILE:** `prisma/schema.prisma`; `prisma/migrations/`
- **LINE/FUNCTION:** `Address` model lines 108–130; Profile relations lines 148–165; migration directory
- **EVIDENCE:** The schema defines the Address table and new relation columns, but no migration SQL contains `Address`, `global_address_id`, or `global_business_address_id`. Historical execution included `db push --accept-data-loss`, but its warning/output and database target were not retained.
- **PROBLEM:** The repository has no reproducible schema evolution for this feature. `prisma migrate deploy` will not create the Address schema, and the exact operations Prisma considered destructive cannot be established.
- **RISK:** Preview/production deployment would either fail at runtime or require an unauditable `db push --accept-data-loss`. Existing Profile data may have been exposed to destructive operations, but the actual impact is unknown.
- **RECOMMENDED FIX:** Create and review an additive Prisma migration from the known production baseline, include pre-deployment backup/checkpoint and post-deploy verification, and prohibit production `db push`. Document recovery/rollback for schema and data.
- **VERIFICATION REQUIRED:** Apply the reviewed migration with `prisma migrate deploy` to a production-like restored database containing representative legacy profiles; prove no table/column removal, unchanged legacy row counts, valid relations, and successful rollback/recovery rehearsal.

### GAS-P1-002 — Authenticated users can update an Address by unowned client-supplied ID

- **SEVERITY:** P1 — HIGH
- **FILE:** `src/app/api/profile/route.ts`
- **LINE/FUNCTION:** `profileUpdateSchema` lines 41–42; `upsertAddress` lines 124–149
- **EVIDENCE:** Both address objects use `z.any()`. If the payload contains `addressData.id`, the route executes `prisma.address.update({ where: { id: addressData.id } })` without proving that the Address belongs to the authenticated user's UserProfile or BusinessProfile.
- **PROBLEM:** This is an object-level authorization failure (IDOR). Authentication protects the route, but ownership of the target Address record is not enforced.
- **RISK:** An authenticated user who obtains another Address ID can overwrite another person's residential address/coordinates and validation metadata before the route links any record to the caller.
- **RECOMMENDED FIX:** Ignore client-supplied Address IDs. Resolve the caller's existing Address through the session-owned profile relation and update only that record, or create a new owned record, inside a transaction.
- **VERIFICATION REQUIRED:** Integration tests must attempt personal/business cross-user Address IDs and prove rejection/no mutation, while same-user create/update/reload succeeds.

### GAS-P1-003 — Business normalized address persistence is routed to the wrong Prisma model

- **SEVERITY:** P1 — HIGH
- **FILE:** `src/app/api/profile/route.ts`; `src/components/profile/ProfileFormClient.tsx`
- **LINE/FUNCTION:** `businessKeys` lines 99–109; business address processing lines 160–166; payload lines 77–81
- **EVIDENCE:** `global_business_address` is declared in Zod and sent by provider profiles, but it is absent from `businessKeys`. It remains in `userProfileData`; `businessProfileData.global_business_address` is therefore never populated, and the unknown property is later passed to UserProfile create/update.
- **PROBLEM:** Provider Profile saves containing a normalized business address do not reach the intended BusinessProfile relation and can fail with an unknown Prisma field.
- **RISK:** A core advertised workflow is broken for Individual Provider and Business Provider accounts, preventing preview acceptance and potentially leaving partial Address records.
- **RECOMMENDED FIX:** Explicitly extract and validate `global_business_address` into the BusinessProfile path and persist/link it transactionally.
- **VERIFICATION REQUIRED:** Integration tests for both provider roles must create, update, reload, and clear business addresses without modifying the personal address or producing orphan rows.

### GAS-P1-004 — Autocomplete (New) request includes an unsupported primary type

- **SEVERITY:** P1 — HIGH
- **FILE:** `src/lib/address/providers/google.ts`
- **LINE/FUNCTION:** `GoogleAddressProvider.autocomplete`, lines 18–24
- **EVIDENCE:** The request sends `includedPrimaryTypes: ['address', 'geocode']`. Current Google Places API (New) documentation permits only documented Table A/Table B types and rejects requests containing an unrecognized type. `geocode` is listed; `address` is not. See [Autocomplete (New)](https://developers.google.com/maps/documentation/places/web-service/place-autocomplete) and [Place Types (New)](https://developers.google.com/maps/documentation/places/web-service/place-types).
- **PROBLEM:** The adapter's core autocomplete request is invalid and is expected to return `INVALID_REQUEST`; the adapter then suppresses the error as an empty result.
- **RISK:** Address search can appear to have no matches for every user even with a valid API key, making the primary implemented workflow nonfunctional.
- **RECOMMENDED FIX:** Remove the unsupported `address` value and use only documented valid primary types, or omit the type restriction if that best matches global-address behavior.
- **VERIFICATION REQUIRED:** Mock the exact outbound request and Google error mapping, then perform a restricted-key integration request proving PH/US/CA/GB/AU/SG/JP suggestions are returned.

### GAS-P1-005 — Canonical residential addresses and coordinates bypass existing Profile encryption

- **SEVERITY:** P1 — HIGH
- **FILE:** `prisma/schema.prisma`; `src/app/api/profile/route.ts`
- **LINE/FUNCTION:** `Address` model lines 108–126; `upsertAddress` payload lines 126–143
- **EVIDENCE:** Address lines, formatted address, locality, administrative areas, postal code, and latitude/longitude are plain Prisma fields. Existing legacy address fields have encrypted companions and `ProfileFieldProtection`; the implementation documents explicitly acknowledge that the new model is not encrypted.
- **PROBLEM:** The canonical system weakens the established protection boundary for residential PII and precise location data.
- **RISK:** A database snapshot, support query, or unintended broad read exposes complete addresses and coordinates in cleartext. This is a privacy/security regression that blocks non-local deployment until explicitly accepted or protected.
- **RECOMMENDED FIX:** Extend the established field-protection/envelope design to the canonical Address payload or its sensitive components, while retaining only the minimum queryable non-sensitive fields required.
- **VERIFICATION REQUIRED:** Database-level tests must prove ciphertext at rest, authorized owner round trips, tamper/failure behavior, key rotation compatibility, and absence of plaintext address fragments/coordinates in persisted rows.

### GAS-P1-006 — Authenticated endpoints are an unbounded proxy to the paid Google API

- **SEVERITY:** P1 — HIGH
- **FILE:** `src/app/api/address/autocomplete/route.ts`; `src/app/api/address/details/route.ts`; `src/components/address/AddressAutocomplete.tsx`; `src/lib/address/providers/google.ts`
- **LINE/FUNCTION:** autocomplete GET lines 13–24; details GET lines 13–27; client request loop lines 30–57
- **EVIDENCE:** Authentication exists, but there is no per-user/IP rate limit, quota, maximum input/place ID/session-token length, country allowlist validation, duplicate suppression, AbortController, or latest-request-wins guard. The UI creates no Google session token. Google recommends a unique token per Autocomplete-to-Details session for billing grouping; see [Session tokens](https://developers.google.com/maps/documentation/places/web-service/place-session-tokens).
- **PROBLEM:** Any authenticated account can generate unlimited paid requests, while normal typing can produce stale/duplicated calls and loses session-based billing semantics.
- **RISK:** Account abuse or ordinary rapid input can cause avoidable billing, quota exhaustion, and service denial for all users.
- **RECOMMENDED FIX:** Add authoritative server-side per-user/IP rate limits and bounded validated parameters; add client cancellation, latest-request-wins, duplicate suppression, and unique session-token lifecycle ending on Details.
- **VERIFICATION REQUIRED:** Rate-limit tests, boundary/fuzz tests, concurrency tests proving stale results cannot win, and request-capture tests proving one token spans each autocomplete selection session.

## P2 Findings

### GAS-P2-001 — Address persistence accepts arbitrary unvalidated structures and fabricated validation metadata

- **SEVERITY:** P2 — MEDIUM
- **FILE:** `src/app/api/profile/route.ts`; `src/lib/address/types.ts`
- **LINE/FUNCTION:** schema lines 41–42; `upsertAddress` lines 124–143
- **EVIDENCE:** Address payloads are `z.any()`. The server accepts client values for `provider`, `providerPlaceId`, `validationStatus`, `validationLevel`, `manuallyEdited`, coordinates, and country code without enums, length limits, ISO validation, coordinate ranges, or cross-field rules.
- **PROBLEM:** A caller can fabricate a Google/provider-selected address, invalid country code, impossible coordinates, or arbitrarily large values.
- **RISK:** Persisted validation state cannot be trusted by downstream consumers, and malformed data can create operational or storage abuse.
- **RECOMMENDED FIX:** Define a strict bounded Zod schema; server-derive provider validation metadata from verified Details results and force manual submissions to `provider=MANUAL`, non-validated status, and `manuallyEdited=true`.
- **VERIFICATION REQUIRED:** Negative API tests for unknown keys, invalid types/statuses/countries, oversized strings, NaN/infinite/out-of-range coordinates, and fabricated provider metadata.

### GAS-P2-002 — Address creation/linking is not atomic and can leave orphan or partially updated data

- **SEVERITY:** P2 — MEDIUM
- **FILE:** `src/app/api/profile/route.ts`
- **LINE/FUNCTION:** `upsertAddress` and Profile persistence lines 123–205
- **EVIDENCE:** Address create/update occurs before UserProfile/BusinessProfile persistence and outside `prisma.$transaction`. Any later failure leaves the Address mutation committed. New saves can create a record without returning/updating the client with the relation's Address ID.
- **PROBLEM:** The profile and canonical Address are not one atomic consistency unit.
- **RISK:** Failed or repeated saves can accumulate orphan rows, mutate an Address without completing the Profile update, or relink away from previous records.
- **RECOMMENDED FIX:** Resolve ownership and perform Address plus Profile upsert/link in one transaction with an idempotent same-profile update path.
- **VERIFICATION REQUIRED:** Inject failures after Address creation and prove rollback; repeat identical saves and prove one Address record and stable relation.

### GAS-P2-003 — Legacy migration is not transaction-safe, demonstrably idempotent, or operationally verifiable

- **SEVERITY:** P2 — MEDIUM
- **FILE:** `scripts/migrate-legacy-addresses.ts`
- **LINE/FUNCTION:** loops lines 15–77; main termination line 98
- **EVIDENCE:** Each record uses separate Address create and Profile update operations. A failure between them creates an orphan and remains eligible on rerun. There is no dry-run, per-record transaction, failure continuation/counters, target-environment guard, or persisted run report. Unknown countries become `null`; decryption failures continue with fallback data. The import chain includes a `server-only` module, while the implementation package records CLI incompatibility.
- **PROBLEM:** The script cannot currently prove safe, repeatable migration or the effect of the stated historical run.
- **RISK:** Existing profiles can be partially migrated, omitted, or linked to incomplete normalized addresses with no trustworthy examined/modified/skipped/failed totals.
- **RECOMMENDED FIX:** Provide a CLI-safe, database-guarded, dry-run-capable migration using one transaction per profile, deterministic rerun protection, explicit error policy, redacted counters, and preservation of unknown original country text.
- **VERIFICATION REQUIRED:** Migration tests with encrypted/plain/null/unknown-country records, injected failures, reruns, rollback, and exact redacted counters on an isolated restored database.

### GAS-P2-004 — Residential autocomplete text is placed in URLs and raw provider failures are logged

- **SEVERITY:** P2 — MEDIUM
- **FILE:** `src/components/address/AddressAutocomplete.tsx`; `src/app/api/address/autocomplete/route.ts`; `src/lib/address/providers/google.ts`; `src/lib/address/AddressService.ts`
- **LINE/FUNCTION:** client fetch line 46; route lines 13–26; provider lines 44–67
- **EVIDENCE:** The user's typed residential address is sent as the `input` query parameter of a GET URL. Provider code logs raw Google response text and exception objects, and service/route layers log errors again.
- **PROBLEM:** Complete or partial residential addresses can enter browser/network traces, reverse-proxy/access logs, observability systems, and raw diagnostic logs unnecessarily.
- **RISK:** PII exposure expands beyond the Profile data store and may violate retention/access expectations.
- **RECOMMENDED FIX:** Use a protected POST body for autocomplete, redact URLs and logs, log only bounded error codes/statuses, and avoid raw provider response dumps.
- **VERIFICATION REQUIRED:** Log-capture tests must prove typed addresses, formatted addresses, place payloads, and provider response bodies never appear in application/access telemetry.

### GAS-P2-005 — Country changes silently discard manually entered address data

- **SEVERITY:** P2 — MEDIUM
- **FILE:** `src/components/address/AddressForm.tsx`
- **LINE/FUNCTION:** `handleCountryChange`, lines 40–52
- **EVIDENCE:** Confirmation is shown only when `providerPlaceId` exists. Any manually entered line, locality, province, or postal code is cleared immediately when country changes.
- **PROBLEM:** The protection is based on provider origin instead of whether user data would be lost.
- **RISK:** Users can lose a complete manual address with one country selection and no warning.
- **RECOMMENDED FIX:** Detect any populated address field and require confirmation before clearing, regardless of provider; then reset all incompatible provider/validation/coordinate fields atomically.
- **VERIFICATION REQUIRED:** Component tests for manual and provider addresses must cover cancel/confirm behavior and prove no mixed-country state remains.

### GAS-P2-006 — Autocomplete cannot be operated reliably by keyboard or assistive technology

- **SEVERITY:** P2 — MEDIUM
- **FILE:** `src/components/address/AddressAutocomplete.tsx`; `src/components/address/CountrySelect.tsx`; `src/components/address/AddressForm.tsx`
- **LINE/FUNCTION:** autocomplete rendering lines 66–99; labels/inputs throughout forms
- **EVIDENCE:** Suggestions are clickable `<li>` elements with no buttons, keyboard handlers, combobox/listbox/option roles, active-descendant state, Escape/arrow/Enter behavior, or announcements. Labels are not associated through `htmlFor`/`id`.
- **PROBLEM:** Keyboard-only and screen-reader users cannot select suggestions or understand dynamic loading/result state reliably.
- **RISK:** The primary workflow is inaccessible and cannot pass the requested browser/accessibility acceptance gate.
- **RECOMMENDED FIX:** Implement the WAI-ARIA combobox pattern or accessible buttons/options with full keyboard navigation, associated labels, and live status/error announcements.
- **VERIFICATION REQUIRED:** Component interaction tests plus axe and keyboard-only browser tests for country selection, search, results, errors, and manual fallback.

### GAS-P2-007 — Valid zero latitude or longitude is converted to null

- **SEVERITY:** P2 — MEDIUM
- **FILE:** `src/lib/address/normalizer.ts`; `src/lib/address/providers/google.ts`; `src/app/api/profile/route.ts`
- **LINE/FUNCTION:** normalizer lines 14–15; Google mapping lines 109–110; Profile payload lines 136–137
- **EVIDENCE:** Each path uses `value || null`. Numeric zero is falsy, so valid coordinates on the equator or prime meridian are discarded.
- **PROBLEM:** Coordinate normalization and persistence are incorrect for legitimate international locations.
- **RISK:** Geospatial behavior, validation, or later mapping can silently lose one or both coordinates.
- **RECOMMENDED FIX:** Use nullish handling (`?? null`) plus finite/range validation.
- **VERIFICATION REQUIRED:** Unit and persistence tests for `(0,0)`, latitude zero, longitude zero, boundaries, null, and invalid numeric values.

### GAS-P2-008 — The default new-address flow hides autocomplete instead of presenting country-first search

- **SEVERITY:** P2 — MEDIUM
- **FILE:** `src/components/address/AddressForm.tsx`
- **LINE/FUNCTION:** state initialization line 34; conditional autocomplete lines 90–96
- **EVIDENCE:** `manualMode` initializes to true whenever no provider place ID exists, including every new profile. The AddressAutocomplete component is therefore hidden until the user manually switches modes.
- **PROBLEM:** The implemented default flow contradicts the documented country → search → suggestion → populate workflow and makes the provider integration non-discoverable.
- **RISK:** Preview acceptance of the advertised feature fails even if the provider is configured.
- **RECOMMENDED FIX:** Default new addresses to search mode after country selection while keeping a continuously available manual fallback; use manual mode for legacy/manual records as appropriate.
- **VERIFICATION REQUIRED:** Component/browser tests for new, legacy, manual, and provider-backed initial states.

### GAS-P2-009 — No automated Address test suite exists

- **SEVERITY:** P2 — MEDIUM
- **FILE:** `tests/` (missing targeted coverage)
- **LINE/FUNCTION:** Country registry, normalizer, Google adapter, Profile API, migration, components, and E2E
- **EVIDENCE:** Targeted searches found no references to `global_address`, `AddressForm`, `GoogleAddressProvider`, `normalizeAddress`, `countryRegistry`, or the migration script.
- **PROBLEM:** The implementation report's test/browser claims have no repository evidence.
- **RISK:** Migration, international mapping, manual fallback, country clearing, ownership, and persistence regressions can reach preview undetected.
- **RECOMMENDED FIX:** Add focused unit, API integration, migration, component, and targeted E2E coverage without relying on production data or live paid calls for routine tests.
- **VERIFICATION REQUIRED:** Execute and retain results for all requested test categories, including representative countries and authorized/unauthorized paths.

### GAS-P2-010 — Address changed-file lint gate fails with 27 errors

- **SEVERITY:** P2 — MEDIUM
- **FILE:** `src/app/api/profile/route.ts`; `src/app/dashboard/profile/page.tsx`; `src/components/profile/ProfileFormClient.tsx`; `src/lib/address/providers/google.ts`; `src/lib/address/types.ts`
- **LINE/FUNCTION:** Scoped ESLint gate
- **EVIDENCE:** ESLint reported 27 errors and two warnings, predominantly `no-explicit-any` at provider context, Profile payload, initial data, and persistence boundaries.
- **PROBLEM:** The implementation does not pass its claimed changed-file quality gate, and the weak types occur at security- and data-integrity-sensitive boundaries.
- **RISK:** Unsafe payload assumptions and mapping defects remain hidden, reinforcing the runtime validation and persistence vulnerabilities above.
- **RECOMMENDED FIX:** Replace `any` with strict request, provider-context, Prisma-select, and Profile prop types; resolve the two unused-variable warnings without disabling rules.
- **VERIFICATION REQUIRED:** Rerun ESLint on exactly the scoped files and require zero errors/warnings, followed by TypeScript and targeted tests.

### GAS-P2-011 — New normalized saves do not update legacy address fields promised for rollback

- **SEVERITY:** P2 — MEDIUM
- **FILE:** `src/app/api/profile/route.ts`; `docs/address-system/address-implementation-plan.md`
- **LINE/FUNCTION:** address persistence lines 123–166; rollback strategy
- **EVIDENCE:** The API links the new Address record but does not update `UserProfile.address/city/province/country` or `BusinessProfile.business_address`. The documented rollback relies on those fields remaining usable.
- **PROBLEM:** After a user changes an address in the new UI, reverting to legacy code exposes stale prior data rather than the latest saved address.
- **RISK:** Rollback can make current address information inaccessible and operational consumers of legacy fields may see inconsistent data.
- **RECOMMENDED FIX:** Define and implement a controlled compatibility strategy—transactional dual-write with established encryption, or update all consumers and document a real rollback/data conversion path.
- **VERIFICATION REQUIRED:** Save/reload and rollback rehearsal tests must prove the latest address remains accessible in both the active and rollback code paths.

### GAS-P2-012 — Address implementation introduces additional standalone Prisma clients

- **SEVERITY:** P2 — MEDIUM
- **FILE:** `src/app/dashboard/profile/page.tsx`; `src/app/api/profile/route.ts`; `scripts/migrate-legacy-addresses.ts`
- **LINE/FUNCTION:** module-level `new PrismaClient()` at page line 8, API line 8, script line 4
- **EVIDENCE:** The feature creates separate PrismaClient instances rather than reusing the repository's shared client for runtime page/API code.
- **PROBLEM:** Multiple runtime clients can create excess connection pools across hot reloads/server instances and complicate transaction/observability behavior.
- **RISK:** Preview/production may experience avoidable database connection exhaustion or inconsistent client lifecycle under concurrency.
- **RECOMMENDED FIX:** Reuse the shared Prisma singleton in application runtime code; keep a separately lifecycle-managed CLI client only where appropriate.
- **VERIFICATION REQUIRED:** Lint/type checks plus concurrency/startup tests showing one runtime client lifecycle and clean script disconnect behavior.

## P3 Findings

### GAS-P3-001 — Required Google key is absent from environment example files

- **SEVERITY:** P3 — LOW
- **FILE:** `.env.example`; `.env.production.example`
- **LINE/FUNCTION:** environment documentation
- **EVIDENCE:** Neither file contains `GOOGLE_MAPS_API_KEY`, although the adapter requires it. Address documentation mentions the key but deployment templates do not.
- **PROBLEM:** Operators can deploy without discovering the required setting from standard environment templates.
- **RISK:** Provider search silently degrades to empty results/manual fallback.
- **RECOMMENDED FIX:** Document the blank server-only key and required API/key restrictions in the example configuration.
- **VERIFICATION REQUIRED:** Configuration smoke test with missing and restricted valid keys; confirm no key enters client artifacts.

### GAS-P3-002 — Full country dataset is imported into the Profile client bundle

- **SEVERITY:** P3 — LOW
- **FILE:** `src/lib/address/countryRegistry.ts`; `src/components/address/CountrySelect.tsx`
- **LINE/FUNCTION:** registry import/map lines 1–19
- **EVIDENCE:** `CountrySelect` is consumed by a client component and imports a `world-countries` JSON dataset measured at 1,408,911 bytes before bundling. Only a small subset of fields is used.
- **PROBLEM:** The Profile client dependency graph can include substantially more country metadata than the UI requires.
- **RISK:** Unnecessary download/parse cost affects mobile Profile usability.
- **RECOMMENDED FIX:** Ship a generated minimal country-option artifact or expose a server-produced minimal list while retaining `world-countries` as the authoritative build-time source.
- **VERIFICATION REQUIRED:** Compare production bundle analyzer output and confirm country accuracy/search behavior after reduction.

### GAS-P3-003 — International field labels imply city and postal code are mandatory everywhere

- **SEVERITY:** P3 — LOW
- **FILE:** `src/components/address/AddressForm.tsx`
- **LINE/FUNCTION:** locality label line 151; postal label line 175
- **EVIDENCE:** `City / Municipality *` and `ZIP / Postal Code *` are shown for all countries even though the inputs are not technically required and many international addresses omit one or use different locality structure.
- **PROBLEM:** The UI communicates a US/Philippines-style completeness rule that the data model does not enforce globally.
- **RISK:** Users may believe legitimate addresses cannot be saved or may enter fabricated values.
- **RECOMMENDED FIX:** Make labels/requirements country-aware or remove universal required indicators while retaining flexible optional storage.
- **VERIFICATION REQUIRED:** Browser tests for PH, US, CA, GB, AU, SG, and JP with legitimate missing/variant fields.

## Informational Findings

### GAS-INFO-001 — Google API key remains server-side

`GOOGLE_MAPS_API_KEY` is read only in `src/lib/address/providers/google.ts` and sent to Google through `X-Goog-Api-Key`. No `NEXT_PUBLIC_` key, client SDK key, key-bearing response, or committed value was found in the scoped files.

### GAS-INFO-002 — Provider abstraction boundary is substantially preserved

Raw Google response handling is confined to `GoogleAddressProvider`; the UI and Profile API consume Address suggestions and `NormalizedAddress`. The use of `any` weakens the compile-time boundary but no raw Google object is persisted directly.

### GAS-INFO-003 — Country registry uses the installed dependency dynamically and representative codes are correct

The implementation maps `world-countries` at runtime rather than copying hundreds of source records. Read-only inspection found 250 entries, zero duplicate alpha-2 codes, and correct PH/US/CA/GB/AU/SG/JP mappings.

### GAS-INFO-004 — Historical database/data effects remain unknown

No retained command output identifies whether the database was development, test, preview, or production; no safe record counts or before/after evidence establish the legacy script's effect. Data loss detected is therefore **UNKNOWN**, not asserted as yes or no.

## Deployment Decision

- **Decision:** `CODEX_REVIEW_CRITICAL_BLOCKER`
- **P0 Count:** 0
- **P1 Count:** 6
- **P2 Count:** 12
- **P3 Count:** 3
- **Informational Count:** 4
- **Safe for local testing:** YES, only with an isolated disposable local database and restricted/non-production Google key.
- **Safe for preview deployment:** NO
- **Safe for production deployment:** NO

Production must not use `prisma db push --accept-data-loss`. A reviewed migration deployable with `prisma migrate deploy` is mandatory before approval.

## Required Remediation

1. Create and rehearse a reviewed, additive Prisma migration and recovery plan; reconcile the historical database target/effect.
2. Enforce Address ownership, strict runtime validation, server-derived validation metadata, and transactional persistence.
3. Correct business-address routing and prove personal/business save/reload behavior.
4. Correct the Google Autocomplete (New) request and implement rate, bounds, cancellation, latest-wins, duplicate, and session-token controls.
5. Restore the established residential-PII protection boundary and remove address data from URLs/raw logs.
6. Make the legacy migration CLI-safe, guarded, idempotent, transactional, tested, and auditable.
7. Add the missing unit/integration/component/E2E suites and pass lint, TypeScript, build, and browser gates.

This report is the new authoritative reconstruction audit for the current repository state. It does not claim identity with the lost prior findings.
