# RENTipid Marketplace Sample Seed V1.0 Evidence

Date: 2026-08-03 (Asia/Shanghai)

Dataset: `RENTIPID-MARKETPLACE-SEED-V1.0`

Database classification: `LOCAL_ISOLATED_TEST` on `127.0.0.1`, database
`rentipid_test_soc`. Credentials and complete URLs are intentionally omitted.

## 1. Completed functionality reused

| Existing item | Classification | Reuse |
|---|---|---|
| Category and category-requirement infrastructure | COMPLETED_REUSE | Canonical rows use existing `Category` and `CategoryRequirement.notes` metadata |
| User/provider profiles | COMPLETED_REUSE | Existing `UserProfile` and `BusinessProfile` one-to-one relations |
| Listing lifecycle, photos, and approval statuses | COMPLETED_REUSE | Existing stored status strings and `ListingPhoto` |
| Booking/status history | COMPLETED_REUSE | Existing `Booking` and `BookingStatusHistory` |
| Mock payments | COMPLETED_REUSE | Existing Mock adapter, Payment, and sandbox GatewayTransaction |
| Damage claims and disputes | COMPLETED_REUSE | Existing `DamageClaim` and `DisputeCase` |
| Test-data separation | COMPLETED_REUSE | Existing `is_test_data` and `beta_label` |
| Phase 13 organic simulation | PRESERVE_PHASE13_ORGANIC | No Phase 13 identities existed in this active database; zero were lost |
| Prohibited Items module | FROZEN_REUSE | Used only through `ProhibitedItemsService`; no frozen file changed |

The existing `prisma/seed.ts` remains the single seed entry point. Its prior baseline
behavior remains available when the marketplace opt-in is absent.

## 2. Existing records reused and missing records created

No existing row matched a V1.0 deterministic identity before run 1. The reconciler
therefore created only the target difference:

| Entity | Existing matching | Reused | Missing created | Final target |
|---|---:|---:|---:|---:|
| Canonical categories | 0 | 0 | 15 | 15 |
| Sample listings | 0 | 0 | 45 | 45 |
| Test providers | 0 | 0 | 5 | 5 |
| Test renters | 0 | 0 | 3 | 3 |
| Booking scenarios | 0 | 0 | 8 | 8 |
| Hidden policy fixtures | 0 | 0 | 6 | 6 |

Identity mappings use canonical slugs, deterministic `@rentipid.local` emails, and
`beta_label=RENTIPID-MARKETPLACE-SEED-V1.0:<seed_key>`. No schema field or migration
was added.

## 3. Legacy redundant test-data cleanup

The transaction matched only exact `Mock Category`, `Test Category`,
`gate4*`, and `test-cat-*` category predicates. Every related listing, booking,
provider, and renter also had to carry exact gate-test IDs/emails and synthetic titles.

Run 1 archived in place:

- Categories: 9
- Listings: 5
- Bookings marked as legacy test data: 5
- Gate-test users marked as legacy test data: 5

Rows with booking history were preserved and hidden rather than deleted. Run 2 found
zero cleanup candidates. Visible legacy-category count is zero.

## 4. Final exact counts

| Evidence | Result |
|---|---:|
| Canonical top-level categories | 15 |
| Canonical subcategories represented in category metadata | 45 |
| Total Category table rows, including 9 archived history rows | 24 |
| V1.0 sample listings | 45 |
| Published sample listings | 29 |
| Submitted sample listings | 8 |
| Draft sample listings | 4 |
| Unavailable sample listings | 4 |
| V1.0 test providers | 5 |
| V1.0 test renters | 3 |
| V1.0 booking scenarios | 8 |
| Hidden policy fixtures, separate from sample listings | 6 |
| Public policy fixtures | 0 |

## 5. First seed run

Guard token: `MARKETPLACE_SAMPLE_SEED_DATABASE_GUARD_PASSED`

| Entity | Before | Reused | Updated | Inserted | Archived | After |
|---|---:|---:|---:|---:|---:|---:|
| Categories | 0 | 0 | 0 | 15 | 9 legacy | 15 |
| Sample listings | 0 | 0 | 0 | 45 | 0 | 45 |
| Providers | 0 | 0 | 0 | 5 | 0 | 5 |
| Renters | 0 | 0 | 0 | 3 | 0 | 3 |
| Booking scenarios | 0 | 0 | 0 | 8 | 0 | 8 |
| Hidden fixtures | 0 | 0 | 0 | 6 | 0 | 6 |

## 6. Second seed run

| Entity | Before | Reused | Updated | Inserted | Archived/deleted | After |
|---|---:|---:|---:|---:|---:|---:|
| Categories | 15 | 15 | 0 | 0 | 0 | 15 |
| Sample listings | 45 | 45 | 0 | 0 | 0 | 45 |
| Providers | 5 | 5 | 0 | 0 | 0 | 5 |
| Renters | 3 | 3 | 0 | 0 | 0 | 3 |
| Booking scenarios | 8 | 8 | 0 | 0 | 0 | 8 |
| Hidden fixtures | 6 | 6 | 0 | 0 | 0 | 6 |

Token: `RENTIPID_MARKETPLACE_SEED_IDEMPOTENCY_PASSED`

The seed was invoked exactly twice.

## 7. Duplicate-query evidence

The post-seed proof used these Prisma predicates and grouped the selected business
identities case-insensitively; it did not infer uniqueness from totals:

- Categories: `findMany({ slug: { in: canonicalSlugs }, is_active: true })`;
  group `lower(name)` and `lower(slug)`.
- Users: `findMany({ email: { in: deterministicEmails }, is_test_data: true })`;
  group `lower(email)` and require exactly one profile relation.
- Listings: `findMany({ beta_label: { in: listingLabels }, is_test_data: true })`;
  group `lower(beta_label)`.
- Bookings: `findMany({ beta_label: { in: bookingLabels }, is_test_data: true })`;
  group `lower(beta_label)`.
- Fixtures: use fixture labels, group `lower(beta_label)`, and count
  `status === 'Published'`.
- Evaluations: select fixture IDs plus evaluation source and policy version; group
  `listingId + policyVersion`.
- Active enforcement cases: select fixture IDs and active statuses; group
  `listingId + policyId`.

Every duplicate group returned an empty array:

- Category names: 0
- Category slugs: 0
- Test emails: 0
- Provider/profile conflicts: 0
- Listing identities: 0
- Booking identities: 0
- Fixture identities: 0
- Policy evaluations: 0
- Active policy cases: 0

## 8. Policy integration findings

All fixtures passed through the frozen service. Actual results:

- Three prohibited fixtures: `PROHIBITED/BLOCK`; PI-017, PI-017, and PI-016.
- Two prepared restricted fixtures: `ALLOWED/ALLOW`.
- One prepared unsupported fixture: `ALLOWED/ALLOW`.

The latter three are recorded as owner-authorized integration findings. The frozen
database has no active RESTRICTED or UNSUPPORTED policy definitions. Visibility safety
is independent of classification: every fixture is non-published, omitted from Browse,
and returns Next's not-found/noindex body without exposing its title.

During run 1, the frozen service's optional critical security-event import emitted a
handled `server-only` error three times. Evaluations and enforcement cases completed;
run 2 created no duplicate evaluation, case, or event. Frozen and SOC files were not
changed.

## 9. Browse-page verification

Local visibility is enabled by `SHOW_MARKETPLACE_TEST_DATA=true` in `.env.local`.
The code fails closed when the flag is absent, the database host is not
`localhost/127.0.0.1`, or `NODE_ENV=production`.

Localhost evidence:

- Home: HTTP 200; canonical Tools & DIY card and canonical filter link present.
- Browse: HTTP 200; 29 unique published sample listing links.
- Tools & DIY filter: 2 matching published listing links.
- Published listing detail: rendered and contained the expected title.
- Draft, submitted, unavailable, and fixture details: titles absent; Next not-found
  marker present.
- Popular Categories and Browse parse the same database category metadata and use the
  same canonical slugs.

## 10. Validation

- Focused Jest: 1 suite passed, 7 tests passed, 0 failed.
- Changed-file ESLint: exit 0; two existing `<img>` optimization warnings, no errors.
- TypeScript: no changed marketplace/seed errors. Repository-wide `tsc --noEmit`
  remains nonzero only for unchanged checkout/security test typing defects.
- Production build: passed after stopping the verified local dev process that locked
  Prisma's Windows DLL. Next compilation, TypeScript, page-data collection, and all 43
  static pages completed.

## 11. Changed-file inventory

- Existing seed entry: `prisma/seed.ts`
- Marketplace reconciler and helpers under `src/lib/marketplace/`
- Browse, home Popular Categories, and listing-detail pages
- Focused marketplace test file
- 45 deterministic SVG assets under `public/seed-assets/`
- Local-only ignored visibility setting in `.env.local`
- This evidence document

No schema, migration, frozen policy, Finance, SOC, Threat Map, production
configuration, payment-live setting, or deployment file was changed.

## 12. Safety audit

- Production accessed: No
- Neon accessed: No
- Live payments activated: No
- `prisma db push` used: No
- `--accept-data-loss` used: No
- `migrate reset` used: No
- Historical migrations modified: 0
- Frozen Prohibited Items files modified: 0
- Finance files modified: 0
- SOC/Threat Map files modified: 0
- Phase 13 organic records lost: 0
- Real non-test records lost: 0 (21 users preserved)
- Duplicate V1.0 seeded records: 0
- Deployment: No
- Commit: No
- Push: No
- Merge: No

The final Git status, diff inventory, and whitespace check are executed once after this
document is written and are reported in the implementation handoff.
