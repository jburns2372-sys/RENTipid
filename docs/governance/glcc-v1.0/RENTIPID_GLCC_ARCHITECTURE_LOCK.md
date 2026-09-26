# RENTipid GLCC v1.0 Architecture Lock

**Status:** **APPROVED & LOCKED FOR GLCC-P1A**  
**Scope:** Architecture lock approved; implementation authorized strictly for `GLCC-P1A`  
**Baseline:** `successor/rc-candidate` at `8016ea0f03fad92aad048cd922aaed88927e0387`  
**Governing plan:** `RENTIPID-GLCC-V1.0-MIP-001`

No accepted GLCC architecture lock was found. This draft does not modify or supersede any accepted architecture lock, evidence record, frozen manifest, or change request.

## 1. Locked objectives

If approved, GLCC will be an additive adaptation layer over existing domain authorities. It will resolve and propagate an effective language/country/currency context, localize presentation, and attach approved FX/translation provenance where needed. It will not create replacement identity, authorization, finance, AI, support, publishing, configuration, or audit systems.

The following responsibilities are logical names, not required filenames or one-table-per-name instructions:

- `GlobalPreferenceResolver`
- `LocaleRegistry`
- `CountryProfileRegistry`
- `CurrencyRegistry`
- `TranslationService`
- `FxRateProviderAdapter`
- `FxQuoteService`
- `MoneyFormatter`
- `LocalizationAdmin`

Implementations must map these responsibilities onto the smallest valid existing/new boundaries.

## 2. Non-negotiable invariants

1. Language, country, display currency, and charge currency are separate values.
2. Language changes cannot change country, currency, permissions, role, pricing, policy, or payment state.
3. Country preference is not residence, tax domicile, identity, sanctions status, or legal eligibility.
4. Display conversion cannot change base/listing value, ledger truth, settlement terms, refund authority, tax rules, deposits, or insurance.
5. Display capability is not charge capability.
6. Checkout re-reads authoritative values and discloses exact charge amount/currency.
7. All consequential quote/amount changes require renewed confirmation.
8. Original source content and authoritative structured values remain available and immutable by translation.
9. Regulated content requires approved, version-linked translation or an approved fallback/block.
10. Existing server-side RBAC, ownership, idempotency, audit, publication, and tool permissions remain authoritative.
11. No runtime path may infer a live FX rate, processor capability, legal approval, or market commitment.
12. Existing transaction history is never rewritten to conform to GLCC.

## 3. Effective preference contract

The resolved tuple will contain, at minimum:

```text
EffectiveGlobalPreference
  languageTag
  countryCode
  displayCurrency
  chargeCurrency
  timezone (optional/resolved separately from country)
  source per field
  explicit/manual marker per field
  registry/reference-data version
  resolvedAt
  policy version
```

Resolution precedence is locked to:

```text
explicit current choice
  > saved account preference
  > guest session
  > first-run browser/coarse-country suggestion
  > platform default
```

Resolution is a pure operation. It receives candidate values, current effective-dated registries, and explicit policy inputs, and returns either a complete valid tuple or a structured safe failure. It does not write cookies, profiles, settings, databases, or financial records.

### 3.1 Proposed policy defaults requiring owner approval

- Country change resets a previous manual display-currency override to the new country's effective default. A user may then explicitly choose an allowed override.
- At sign-in, an explicit current guest choice controls the active session and is offered for save; absent an explicit guest choice, the saved account preference wins.
- The initial implementation retains path-unprefixed routes. Locale-prefixed URLs are out of scope until separately approved.
- Platform proposal: `en-PH` / `PH` / `PHP` display / `PHP` charge. This is disabled as a GLCC launch commitment until approved.
- Charge conversion is disabled.

These defaults may be represented as policy inputs in P1A so owner approval can select behavior without rewriting resolver logic.

## 4. Exact reuse and ownership boundaries

| Authority | Existing path / record | Locked treatment |
|---|---|---|
| Root document metadata | `src/app/layout.tsx` | Future effective `lang`/`dir` integration; retain existing metadata until authorized |
| Shared navigation | `src/components/layout/Header.tsx` | Future selector insertion point; reuse design/auth behavior |
| Account/profile UI | `src/components/profile/ProfileFormClient.tsx` and account settings surfaces | Extend only after preference persistence is approved |
| Profile API | `src/app/api/profile/route.ts` | Do not treat discarded `preferred_language` as existing persistence; later reconcile explicitly |
| Address country lookup | `src/lib/address/countryRegistry.ts` and country data | Reuse names/codes only; never use address country as preference authority |
| Authentication | `src/lib/auth.ts` | Remains identity/session authority |
| Request gate/RBAC | `src/proxy.ts` | Preserve dashboard match/redirect semantics; no locale-prefix change in P1A |
| Configuration/flags | Prisma `SystemSetting` and existing access patterns | Reuse singular active authority; do not add another settings framework |
| Audit | `src/lib/audit.ts` and security-event facilities | Record bounded changes/administration; never log secrets/raw sensitive payloads |
| Listing/booking price | Prisma Listing/Booking fields and pricing services | Remain base/authoritative values; GLCC does not rewrite them |
| Checkout | `src/app/checkout/[bookingId]/actions.ts` | Preserve server re-read, ownership, status, and idempotency |
| Payment policy | `src/lib/payments/payment-currency-policy.ts` | Existing PHP policy remains until an approved, evidenced extension |
| Payment adapters | `src/lib/payments/payment-gateway-registry.ts` and registered adapters | Extend only after merchant/environment capability proof |
| Payment lifecycle | webhook service, reconciliation, payment action log | Remain transaction-state authorities |
| Ledger/refunds/payouts | Existing finance ledger, RefundRequest, ProviderPayout services/models | Remain deterministic financial authorities |
| Receipt | `src/app/dashboard/renter/payments/[id]/receipt/page.tsx` | Future presentation localization; transaction fields remain structured |
| Payout statement | `src/app/dashboard/provider/payouts/[id]/statement/page.tsx` | Same boundary as receipt |
| Unified AI architecture | `docs/unified-ai-customer-service/ARCHITECTURE_LOCK.md` | Accepted lock remains unchanged |
| AI entry/command | `src/app/api/ai/chat/route.ts`, `src/lib/ai/ai-command-layer.ts` | Receive effective locale/context; no duplicate orchestration |
| Tool permissions | `src/lib/ai/tools/AiToolGateway.ts` | Remains permission/idempotency/audit authority |
| AI knowledge/context | `src/lib/ai/knowledge/`, `src/lib/ai/context/knowledge-retrieval.ts` | Add approved locale selection, not a parallel corpus authority |
| AI cases/support | `src/lib/ai/cases/AiCasePlatform.ts` | No second support/case platform |
| Social Growth | Existing social facade and approval workflow | Translation cannot publish or bypass approval |
| Email delivery | `src/lib/auth/unified/email-delivery.ts` | Reuse transport; later introduce versioned approved templates |
| Notifications | Existing Notification model/create paths | Reuse delivery; future locale/source-version snapshot required |
| Tests | Jest and Playwright configuration/suites | Add targeted unit/integration/E2E coverage using existing runners |
| Deployment/evidence | Existing `docs/releases/` structure and Vercel linkage | Reuse evidence discipline; do not alter frozen records |

## 5. New minimal boundaries

### 5.1 P1A: pure contracts only

Proposed new paths:

- `src/lib/glcc/contracts.ts`
- `src/lib/glcc/preference-resolver.ts`
- `src/lib/glcc/registry-contracts.ts`
- `tests/glcc/contracts.test.ts`
- `tests/glcc/preference-resolver.test.ts`

No dependency is added. The code must be deterministic, side-effect-free, server/client-neutral TypeScript where practicable, and unaware of Prisma, Next request APIs, payment adapters, or translation providers.

### 5.2 Later boundaries, not authorized

After P1A and explicit decisions, the smallest likely persistent boundary is a dedicated account preference record rather than overloading address/profile country. Guest state belongs in a bounded, integrity-protected first-party preference cookie/session and must exclude sensitive or financial truth.

Effective-dated registries need validated unique codes, active windows, versions, and allowed mappings. Whether each registry is stored as dedicated tables or versioned reference manifests must be decided in the migration design; logical component names do not mandate tables. `SystemSetting` may hold rollout/config switches but should not become an unconstrained substitute for relational integrity if country/currency mappings require constraints and history.

Translation memory/bundles, dynamic translation records, FX rates, FX quotes, and transaction snapshots are different data classes and must not share an undifferentiated table or cache.

## 6. Routing, rendering, and caching lock

- P1A changes no routes.
- The current dashboard proxy matcher and auth redirects remain unchanged.
- A later server adapter may resolve request preference from authenticated account context and integrity-protected guest state, then pass a serializable tuple to clients.
- Request cookies/headers are asynchronous request-time inputs in the installed Next.js version. Callers must use the installed framework APIs, not remembered older conventions.
- Cache identity must include every value that changes output: locale, country, display currency, reference/translation version, and, for priced flows, quote/version and user/guest scope.
- Checkout quote data is never placed in an unsafe shared public cache.
- User-scoped preference responses must be private/no-store unless a reviewed keyed design proves isolation.
- The existing root is already dynamic; future caching must be intentional rather than assumed.
- No new service worker, locale routing, SEO, native/mobile, or PWA architecture is authorized by this lock.

## 7. Localization and content lock

### 7.1 Static strings

Static application strings will use versioned approved bundles. Required behaviors:

- exact locale -> approved family -> platform default fallback;
- missing-key telemetry and safe default text, never a raw key;
- placeholder schema validation and escaped interpolation;
- pluralization and date/number/percent/unit formatting using approved locale metadata;
- `lang`, and `dir` only for enabled RTL locales;
- keyboard, focus, bidi isolation, and text-expansion coverage;
- default-market snapshots/semantics protected as regression evidence.

### 7.2 Dynamic content

Provider/user text retains the original. Any translated derivative records source ID/version/hash, source and target locales, provider/model/version, creation time, review/approval state, and invalidation state. Rich output is treated as untrusted and sanitized through an approved renderer.

Structured identifiers, dates, currency codes, amounts, quote IDs, policy outcomes, URLs, permissions, and tool results are separate structured fields, not free translation input.

### 7.3 Regulated content

Terms, policies, consent, disclosures, refund rules, safety instructions, and other regulated content require an authorized source version and authorized target approval. Missing approval uses an owner-approved fallback or blocks that locale/surface. Automated translation cannot self-approve.

## 8. Country, currency, money, and FX lock

### 8.1 Registry responsibilities

`CountryProfileRegistry` maps an active/effective country profile to a default display currency and allowed override set. It does not determine tax domicile, identity, eligibility, payment acceptance, or settlement.

`CurrencyRegistry` supplies ISO code, active window, exponent/minor-unit metadata, and formatting metadata. Zero-, two-, and three-minor-unit currencies must be representable even if not launch markets.

### 8.2 Six currency roles

Every priced flow must keep these roles explicit:

```text
listing/base | display | charge | ledger | provider settlement | refund
```

The same code may occupy multiple roles, but roles cannot be collapsed in storage/contracts by assumption.

### 8.3 Existing representation compatibility

Historical Float fields remain historical truth and are not bulk-converted by this module. Before P5/P6, an approved monetary compatibility design must identify:

- authoritative source field at each stage;
- conversion to exact decimal/minor units at a named boundary;
- exponent metadata and rounding mode;
- serialization format;
- loss/reconciliation handling for historical Float inputs;
- immutable transaction snapshots;
- database/provider differences;
- zero/two/three-minor test vectors.

### 8.4 FX quote contract

An approved quote includes:

```text
quoteId, sourceCurrency, sourceAmount,
targetCurrency, targetAmount,
rate, rateDirection, ratePrecision,
provider/source, sourceTimestamp,
createdAt, expiresAt,
fee/spread policy version,
rounding policy version,
context, idempotency key,
status/version
```

Browse estimates are labeled estimates and carry provenance/timestamp. Checkout accepts only a fresh, context-valid quote. Stale, outlier, unsupported, unavailable, timed-out, or inconsistent quotes fail safely. Repricing after user confirmation requires re-confirmation.

No provider/source is selected by this draft. No live rate fixture is seeded.

### 8.5 Payment boundary

PHP charge behavior remains the only repository-supported policy observation. Multi-currency charge is off until the actual configured processor, merchant account, environment, method, and transaction path are evidenced. Provider documentation alone is insufficient.

Refunds, deposits, insurance, ledger postings, reconciliation, and payouts remain under current domain authorities. AI and translation cannot calculate or mutate them.

## 9. Proposed data model and migration approach

This section prepares a later design; it does not authorize a migration.

### 9.1 Likely additive entities

- Account global preference, one active record per user, with independent locale/country/display currency, explicitness/source, policy/reference version, optimistic version, and timestamps.
- Versioned locale definition.
- Versioned country profile with effective window/default display currency/allowed overrides.
- Versioned currency definition with exponent and active window.

Audit history should use the existing audit authority unless a demonstrated retention/query requirement demands a dedicated append-only record. Guest state is not a database identity record. Translation and FX entities are later-package designs.

### 9.2 Constraints and indexes

A later proposal must include:

- canonical BCP 47 and ISO code validation at ingress;
- unique active code/version and non-overlapping effective windows where supported;
- foreign keys for approved mappings;
- indexes for active-at-time lookup and user preference lookup;
- optimistic concurrency/version checks;
- no destructive defaults on historical transaction records;
- application compatibility while old and new code overlap;
- rollback that disables reads/writes without dropping evidence.

PostgreSQL-specific behavior, Prisma Decimal mapping, constraints, and migration SQL must be reviewed. Local validation does not prove Preview migration behavior.

### 9.3 Reference-data readiness

Reference data will use deterministic, reviewable manifests containing version, effective dates, approval state/source, and digest. Reruns must be idempotent and preserve existing records and approval history. The sync must report create/update/no-op/conflict counts without logging secrets.

Locale/country/currency manifests are distinct from:

- live/operational FX rates;
- locked quotes;
- account/guest preferences;
- transaction snapshots;
- legal translation approval history.

No invented live rate or customer record is permitted in seed data. Owner acceptance fixtures are synthetic and clearly labeled.

## 10. Feature flags, observability, and rollback

Future controls use the active singular `SystemSetting` authority and existing audit patterns. Proposed flags remain names for later approval, not current configuration:

- GLCC master presentation flag;
- preference persistence/read flag;
- static locale per-locale enablement;
- display-conversion flag;
- checkout charge-conversion flag, default off;
- dynamic translation per content class;
- admin mutation flag.

Flags fail closed to the original market experience. Disabling GLCC must not rewrite preferences or transaction history.

Metrics/alerts must cover missing keys, fallback rate, provider failures/latency, FX age/outlier rejection, expired quotes, legal-content blocks, displayed-versus-charged mismatch, preference reconciliation failures, and cache-scope violations. Owners, thresholds, and costs are undecided.

Rollback is layered:

1. disable the affected capability/locale;
2. fall back to approved source/default content and original pricing display;
3. preserve reference versions, preferences, quotes, transaction snapshots, and audit history;
4. recover transaction state from the authoritative provider/domain owner;
5. never drop/overwrite records as a runtime rollback mechanism.

## 11. Security and privacy controls

- Validate locale/country/currency against active registries; never trust client labels or price values.
- Re-read authenticated user and permissions server-side.
- Prevent cross-user preference/quote/cache access.
- Require admin authorization and audit for registry, translation, legal approval, provider, and rollout changes.
- Minimize provider payloads; redact PII/secrets and define retention before activation.
- Treat translations as untrusted content; escape placeholders and sanitize any permitted rich text.
- Defend translation/AI inputs against prompt injection; injected content cannot grant tools, roles, approvals, or financial mutation.
- Preserve idempotency for preference saves, quote locking, payment attempts, webhooks, refunds, and payouts in their owning services.
- Never expose credentials, connection strings, full provider payloads, or real customer data in evidence.

## 12. Test plan by layer

### P1A unit tests

- five-level precedence and field-by-field source attribution;
- language/country/currency independence;
- effective-date boundaries and version propagation;
- allowed/unsupported/inactive selections;
- atomic immutable result and structured failure;
- policy-driven country override and guest/account conflict behavior;
- exponent metadata representation for 0/2/3 digits.

### Later component/integration tests

- server/account/guest adapters and concurrent updates;
- atomic Apply/Cancel and sign-in reconciliation;
- bundle fallback, placeholders, plurals, escaping, missing keys;
- `lang`/RTL/focus/keyboard/text expansion;
- cache identity and cross-user isolation;
- versioned reference sync/idempotency/conflict preservation;
- dynamic translation provenance/invalidation/sanitization;
- legal-content fallback/block;
- FX freshness/outlier/expiry/idempotency/reproducibility;
- checkout re-read/reconfirmation/provider-state recovery;
- receipt/notification/document locale and immutable money snapshot;
- AI/Digital Human locale context with unchanged tool/RBAC authority;
- default-market regression and all Section 14 acceptance IDs.

### Environment proof

- Local G2 may use declared test doubles but cannot imply G3/G4.
- G3 requires executed local migration evidence.
- G4 requires actual manifest/data readiness and idempotent rerun evidence.
- G5 requires full local acceptance and a frozen local candidate record.
- G6/G7 require separately identified Preview resources, exact deployment/runtime/schema/data state, and integration/browser evidence.
- Shared Preview/production payment, notification, provider, or configuration writes require later explicit authorization and isolation.

## 13. Commands and side-effect classification

Commands are taken from the repository or installed binaries; future execution remains subject to authorization and isolation.

| Command | Classification / lock |
|---|---|
| `.\node_modules\.bin\prisma.cmd validate` | Safe schema validation observed; no DB migration |
| `npm.cmd run typecheck -- --incremental false` | Typecheck; current generated `.next` baseline fails |
| `npm.cmd run lint` | Static lint; current broad baseline fails |
| `.\node_modules\.bin\dotenv.cmd -e .env.test.local -e .env.test -- .\node_modules\.bin\jest.cmd --runInBand --no-cache --forceExit <target tests>` | Targeted test pattern only after confirming test files are pure/guarded |
| `npm.cmd run build` | **Do not run in P0**; includes `prisma generate` and build output writes |
| Full Jest/Playwright/E2E scripts | **Do not run** until hooks, isolation, external writes, and test resources are confirmed |
| Prisma migrate/seed scripts | **Not authorized** until the applicable gate/environment procedure is approved |
| Vercel/deployment commands | **Not authorized** by this lock |

P1A verification should target only the proposed GLCC unit tests plus typecheck/lint scoped as feasible. Existing global failures must be reported, not weakened or silently repaired.

## 14. Environment isolation requirements

Before a command can reach a database/provider, capture and verify, without exposing values:

- environment name and exact application/deployment identity;
- database provider, branch/project identity, and non-production classification;
- callback/webhook targets;
- storage buckets/containers;
- job/queue targets;
- email/SMS/push sinks;
- payment/FX/translation sandbox account and mode;
- feature-flag/config namespace;
- notification suppression;
- cleanup/rollback owner.

Similar names are not proof. A prior Preview-to-production domain incident makes current resource-level verification mandatory. If any test/local/Preview path can reach production, stop that path while continuing safe document/source review.

## 15. Freeze and invalidation mechanics

### G5 local checkpoint

Record exact candidate SHA and dirty-state/diff identity, lockfile digest, toolchain, migrations, schema digest, reference/translation manifest digests, relevant flags/config versions, test fixtures, every acceptance result, limitations, and evidence digest. Mark the local checkpoint frozen only after G5 passes; do not tag automatically.

### G7 Preview checkpoint

In addition to G5 material, record exact Preview URL, Vercel deployment/build ID, runtime provenance/SHA, resource identities (redacted), Preview schema/migration state, data manifest state, provider modes, browser/integration evidence, callbacks/jobs/notifications, and acceptance results. Freeze only after G7 passes.

### Evidence invalidation

If code, dependency, schema, relevant configuration, translation baseline, reference data, acceptance fixture/basis, or deployment identity changes, identify the earliest affected package/gate and repeat that proof plus dependent regressions. Do not rerun unrelated frozen modules without a concrete dependency or defect.

Freeze release policy/evidence, not live quotes, transactions, user preferences, or future rate observations. Controlled reference-data updates use the approved change process. G8 is readiness, not G9 authorization; G11 requires the owner; G12 and G13 remain separate.

## 16. Lifecycle lock

The only permitted release sequence is:

```text
G1  CODE COMPLETE
 -> G2  LOCAL FUNCTIONAL
 -> G3  LOCAL DATABASE MIGRATED
 -> G4  LOCAL REQUIRED DATA SEEDED/SYNCED
 -> G5  LOCAL ACCEPTANCE PASS - LOCAL CHECKPOINT FROZEN
 -> G6  PREVIEW MIGRATED
 -> G7  PREVIEW ACCEPTANCE PASS - PREVIEW CHECKPOINT FROZEN
 -> G8  PRODUCTION-READY
 -> G9  PRODUCTION DEPLOYMENT/VERIFICATION
 -> G10 COMPLETED
 -> G11 ACCEPTED
 -> G12 CLOSED
 -> G13 VERSION FROZEN
```

G5/G7 freezes are checkpoint controls inside those gates, not extra gates or substitutes for G13. P0-P12 organize work and cannot replace or imply gates.

## 17. Approval record

**Owner decision:** **APPROVED** (2026-09-25)  
**Approved scope:** `GLCC-P1A - Pure preference and registry contracts`  
**Implementation authority:** Limited to the 6-file allowlist (`src/lib/glcc/contracts.ts`, `src/lib/glcc/preference-resolver.ts`, `src/lib/glcc/registry-contracts.ts`, `tests/glcc/contracts.test.ts`, `tests/glcc/preference-resolver.test.ts`, governance updates)  
**Migration/seed authority:** NONE  
**Preview/production authority:** NONE  

Owner approval record:
> "Approve GLCC Architecture Lock and authorize GLCC-P1A"

