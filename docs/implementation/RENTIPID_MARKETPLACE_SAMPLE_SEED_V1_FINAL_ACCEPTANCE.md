# RENTipid Marketplace Sample Seed V1.0 — Final Acceptance

Date: 2026-08-03 (Asia/Shanghai)

Validator: Antigravity (Independent)

## Scope

Dataset: `RENTIPID-MARKETPLACE-SEED-V1.0`

Catalogue: `seed-data/rentipid_marketplace_sample_seed_catalog.json`

Catalogue version: `RENTIPID-MARKETPLACE-SEED-V1.0`

Repository: `C:\Users\user\Documents\JD SOFTWARE PROJECTS\RENTipid`

HEAD: `5804d4cceafc74e5e51b554be6f84a1b9c80e8be`

---

## 1. Final Dataset Counts

| Evidence | Result |
|---|---:|
| Canonical top-level categories | 15 |
| Canonical subcategories in metadata | 45 |
| V1.0 sample listings | 45 |
| Published sample listings | 29 |
| Submitted sample listings | 8 |
| Draft sample listings | 4 |
| Unavailable sample listings | 4 |
| V1.0 test providers | 5 |
| V1.0 test renters | 3 |
| V1.0 booking scenarios | 8 |
| Hidden policy fixtures (separate from 45 listings) | 6 |
| Public policy fixtures | 0 |

Source: Evidence file Section 4 and catalogue `counts` object, independently verified.

---

## 2. Idempotency Proof

Token: `RENTIPID_MARKETPLACE_SEED_IDEMPOTENCY_PASSED`

Second seed run results:

| Entity | Before | Reused | Updated | Inserted | Archived/Deleted | After |
|---|---:|---:|---:|---:|---:|---:|
| Categories | 15 | 15 | 0 | 0 | 0 | 15 |
| Sample listings | 45 | 45 | 0 | 0 | 0 | 45 |
| Providers | 5 | 5 | 0 | 0 | 0 | 5 |
| Renters | 3 | 3 | 0 | 0 | 0 | 3 |
| Booking scenarios | 8 | 8 | 0 | 0 | 0 | 8 |
| Hidden fixtures | 6 | 6 | 0 | 0 | 0 | 6 |

Before/after totals agree for every entity. Inserted = 0 for all entities on run 2.

---

## 3. Zero-Duplicate Proof

Evidence method: Prisma predicates grouped case-insensitively on business identities,
not inferred from totals alone.

| Duplicate check | Result |
|---|---:|
| Canonical category names | 0 |
| Canonical category slugs | 0 |
| V1.0 test emails | 0 |
| V1.0 provider profiles | 0 |
| V1.0 renter identities | 0 |
| V1.0 listing identities | 0 |
| V1.0 booking identities | 0 |
| Hidden fixture identities | 0 |
| Active policy cases per fixture/version | 0 |
| Policy evaluations from run 2 | 0 |
| Policy events from run 2 | 0 |
| **Duplicate V1.0 seeded records** | **0** |

---

## 4. Data Preservation Proof

| Preservation check | Result |
|---|---|
| Phase 13 organic records lost | 0 |
| Real non-test records lost | 0 |
| Real users preserved | 21 |
| Real provider converted to seed | No |
| Real renter converted to seed | No |
| Real listing relabeled as V1.0 test | No |
| Organic booking included in 8-scenario count | No |
| Cleanup predicates targeted only proven legacy test data | Yes |

---

## 5. Browse and Visibility Proof

| Verification | Result |
|---|---|
| Popular Categories uses canonical slugs | Yes |
| Browse Rentals displays approved V1.0 listings | Yes (29 published) |
| Category links resolve correctly | Yes |
| Category filtering returns corresponding listings | Yes |
| Listing detail pages load for published listings | Yes |
| Mock Category visible | No |
| Test Category visible | No |
| Gate-prefixed categories visible | No |
| Draft listings hidden | Yes |
| Submitted listings hidden | Yes |
| Unavailable listings hidden | Yes |
| All 6 policy fixtures hidden | Yes |
| Test data fails closed when flag absent | Yes |
| Production behavior hides test data | Yes |

---

## 6. Frozen Policy Integration

Frozen dependency: `RENTIPID_PROHIBITED_ITEMS_MODULE_ACCEPTED_CLOSED_AND_FROZEN`

| Check | Result |
|---|---|
| Frozen policy source files modified | 0 |
| Frozen policy models modified | 0 |
| Frozen policy migrations modified | 0 |
| Frozen policy tests modified | 0 |
| Frozen appeals implementation modified | 0 |
| Run 2 duplicate policy evaluations | 0 |
| Run 2 duplicate enforcement cases | 0 |
| Run 2 duplicate policy events | 0 |
| All negative fixtures non-public | Yes |
| Visibility safety independent of classification | Yes |

Integration findings (owner-authorized): Two RESTRICTED fixtures and one UNSUPPORTED
fixture classified as `ALLOWED/ALLOW` because the frozen database contains no active
RESTRICTED or UNSUPPORTED policy definitions. Visibility safety is independent of this
classification. Recorded as findings, not defects.

---

## 7. Test and Build Evidence

| Check | Result |
|---|---|
| Focused Jest suite | 1 suite, 7 tests passed, 0 failed |
| Changed-file ESLint | Exit 0 (2 existing `<img>` warnings, 0 errors) |
| Changed-file TypeScript | No marketplace/seed errors |
| Production build | Passed (43 static pages) |

---

## 8. Authoritative Marketplace Seed V1 Changed-File Inventory

**Modified tracked files:**

- `prisma/seed.ts`
- `src/app/browse/page.tsx`
- `src/app/listing/[id]/page.tsx`
- `src/app/page.tsx`

**New untracked files:**

- `seed-data/rentipid_marketplace_sample_seed_catalog.json`
- `src/lib/marketplace/category-metadata.ts`
- `src/lib/marketplace/sample-seed-catalog.ts`
- `src/lib/marketplace/seed-reconciler.ts`
- `src/lib/marketplace/test-data-visibility.ts`
- `tests/marketplace/marketplace-sample-seed.test.ts`
- `docs/implementation/RENTIPID_MARKETPLACE_SAMPLE_SEED_V1_EVIDENCE.md`
- 45 deterministic SVG assets under `public/seed-assets/`

---

## 9. Marketplace-Scoped git diff --check

Command:

```
git diff --check -- prisma/seed.ts src/app/browse/page.tsx "src/app/listing/[id]/page.tsx" src/app/page.tsx docs/implementation/RENTIPID_MARKETPLACE_SAMPLE_SEED_V1_EVIDENCE.md seed-data/rentipid_marketplace_sample_seed_catalog.json src/lib/marketplace/category-metadata.ts src/lib/marketplace/sample-seed-catalog.ts src/lib/marketplace/seed-reconciler.ts src/lib/marketplace/test-data-visibility.ts tests/marketplace/marketplace-sample-seed.test.ts
```

Result: **Exit 0**

`MARKETPLACE_SCOPE_GIT_DIFF_CHECK: Exit 0`

---

## 10. Global Unrelated Whitespace Baseline

`PREEXISTING_OUT_OF_SCOPE_GLOBAL_DIFF_WHITESPACE_BASELINE`

The following files trigger trailing-whitespace or blank-line-at-EOF warnings in the
repository-wide `git diff --check`. None were created or changed by Marketplace Seed V1:

| File | Classification |
|---|---|
| `apps/api/src/middleware/appInsights.ts` | PREEXISTING_UNRELATED_WORKTREE_CHANGE |
| `apps/api/src/middleware/auth.ts` | PREEXISTING_UNRELATED_WORKTREE_CHANGE |
| `infrastructure/modules/compute/main.tf` | PREEXISTING_UNRELATED_WORKTREE_CHANGE |
| `scripts/run-phase17-rehearsal.ps1` | PREEXISTING_UNRELATED_WORKTREE_CHANGE |
| `src/app/checkout/[bookingId]/actions.ts` | PREEXISTING_UNRELATED_WORKTREE_CHANGE |
| `src/app/checkout/[bookingId]/page.tsx` | PREEXISTING_UNRELATED_WORKTREE_CHANGE |
| `src/app/dashboard/admin/security/layout.tsx` | PREEXISTING_UNRELATED_WORKTREE_CHANGE |
| `src/app/dashboard/super-admin/live-payment-execution/page.tsx` | PREEXISTING_UNRELATED_WORKTREE_CHANGE |
| `src/lib/security/permissions.ts` | PREEXISTING_UNRELATED_WORKTREE_CHANGE |
| `tests/security/integration/profile-backfill-dry-run.integration.test.ts` | PREEXISTING_UNRELATED_WORKTREE_CHANGE |
| `tests/security/integration/profile-backfill-isolated-write.integration.test.ts` | PREEXISTING_UNRELATED_WORKTREE_CHANGE |
| `tests/security/rules/phase3-lifecycle.integration.test.ts` | PREEXISTING_UNRELATED_WORKTREE_CHANGE |
| `tests/security/rules/rule-evaluator-worker.test.ts` | PREEXISTING_UNRELATED_WORKTREE_CHANGE |
| `tests/security/soc-recovery.test.ts` | PREEXISTING_UNRELATED_WORKTREE_CHANGE |

None of these files appear in the Marketplace Seed V1 changed-file inventory. None were
modified during this validation. All are left untouched.

Global `git diff --check`: `BLOCKED_BY_PREEXISTING_OUT_OF_SCOPE_GLOBAL_DIFF_WHITESPACE_BASELINE`

Marketplace Seed V1 scoped `git diff --check`: **PASS — Exit 0**

---

## 11. Known Unrelated Baseline Defects

- `PREEXISTING_OUT_OF_SCOPE_THREAT_MAP_BUILD_DEFECT` — Unchanged `SocThreatMap.tsx` with
  missing `react-simple-maps`. Not part of Marketplace Seed V1 scope.
- `PREEXISTING_OUT_OF_SCOPE_GLOBAL_DIFF_WHITESPACE_BASELINE` — 14 unrelated files with
  trailing whitespace. Not part of Marketplace Seed V1 scope.

---

## 12. Safety Audit

| Check | Result |
|---|---|
| Production accessed | No |
| Neon accessed | No |
| Live payments activated | No |
| `prisma db push` used | No |
| `--accept-data-loss` used | No |
| `migrate reset` used | No |
| Historical migrations modified | 0 |
| Frozen Prohibited Items files modified | 0 |
| Finance files modified | 0 |
| SOC/Threat Map files modified | 0 |
| Phase 13 organic records lost | 0 |
| Real non-test records lost | 0 |
| Duplicate V1.0 seeded records | 0 |
| Public hidden-policy fixtures | 0 |
| Deployment | No |
| Commit | No |
| Push | No |
| Merge | No |
| Unrelated whitespace files modified | 0 |
| Marketplace-scoped `git diff --check` | Exit 0 |

---

## 13. Checksums

| File | SHA-256 |
|---|---|
| Catalogue | `3AE148BF48E28C0C783CACB5ECEFCBFE13C03A5DB39860CAEF5D525FCF3939E0` |
| Evidence | `DED045D1545A867A30F0F655A29F925DDAE5C385FCF0B7076240E1F50643B1D1` |

---

## Final Acceptance Decision

All Marketplace Seed V1 scoped gates pass:

- ✅ 15 canonical top-level categories
- ✅ 45 realistic sample listings
- ✅ 5 test providers
- ✅ 3 test renters
- ✅ 8 booking scenarios
- ✅ 6 hidden policy fixtures
- ✅ Idempotency passed
- ✅ Zero duplicate seeded records
- ✅ Zero public hidden fixtures
- ✅ Browse-page consistency passed
- ✅ Phase 13 organic data preserved
- ✅ Real non-test data preserved
- ✅ Frozen modules unchanged
- ✅ No prohibited operations used
- ✅ Focused validation passed
- ✅ Marketplace-scoped git diff --check: Exit 0

**ACCEPTED**
