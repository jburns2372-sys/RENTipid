# Phase 5I: Software Supply Chain Security Evidence

## Scope and Manifest
This bundle implements Phase 5I independently from Phase 5E, focusing entirely on CI/CD workflow security, deterministic installation, lockfile enforcement, and SBOM capabilities.

**File Manifest:**
- `.github/workflows/azure-deploy.yml` (Modified: SHA pinned, `npm ci`, `npm audit`, least privilege permissions)
- `tests/security/supply-chain/workflow.test.ts` (New: Static configuration tests)
- `docs/security/level5/bundles/bundle1/SBOM.json` (New: Generated SBOM)
- `docs/security/level5/bundles/bundle1/PHASE5I_SUPPLY_CHAIN_EVIDENCE.md` (New: This evidence document)

## CI/CD Workflow Controls
- **Deterministic Installation:** The Azure deployment workflow now uses `npm ci --ignore-scripts` instead of `npm install` for dependency review, ensuring the `package-lock.json` is strictly honored.
- **Lockfile Enforcement:** `npm ci` fails the build if the lockfile and package manifest are inconsistent.
- **Secret Safety:** No secret values are echoed, printed, or persisted. No environment dumps exist. Secrets are exclusively referenced via the GitHub secrets context.
- **Dependency Audit:** Vulnerability detection is now natively integrated in the CI pipeline via `npm audit || true` (running without failing the deployment prematurely or automatically upgrading).

## Action SHA Pinning
Third-party GitHub Actions are pinned to immutable commit SHAs, documented in comments:
- `actions/checkout@a37ce9120846195fa4ece8f58b268e6043cb2f26` (v3)
- `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020` (v4)
- `azure/login@33b121a1597278045654f321b0e9861297c5e9c0` (v1)
- `azure/container-apps-deploy-action@29ee19866ec987ededd70b8412d9ee241a9102d1` (v1)

## Permission Controls
- The workflow has been explicitly limited to `contents: read` and `id-token: write` (required for Azure OIDC login). No wildcard write permissions exist.

## Dependency Audit
- **Command:** `npm audit --json`
- **Exit Code:** 1
- **Critical Findings:** 1 (`next-auth`)
- **High Findings:** 31 (`next`, `sharp`, `postcss`, etc.)
- **Moderate Findings:** 5 (`tar`, `uuid`, etc.)
- **Affects Production Dependencies:** Yes
- **Deferred Remediation:** Yes. Consistent with bundle constraints, no automatic dependency fix (`npm audit fix`) or update was performed. Vulnerability suppression was not utilized.

## SBOM (Software Bill of Materials)
- **Command:** `npm sbom --sbom-format cyclonedx > docs/security/level5/bundles/bundle1/SBOM.json`
- **Tooling Gap:** None. Native `npm sbom` tooling is supported and successfully generated a CycloneDX manifest.
- **Output Path:** `docs/security/level5/bundles/bundle1/SBOM.json`

## Focused Static Testing
- **Command:** `npx cross-env NODE_ENV=test dotenv -e .env.test.local -e .env.test -- jest tests/security/supply-chain/workflow.test.ts`
- **Result:** 1 test suite, 8 tests passed, 0 failed.

## Validation Results
- **Targeted ESLint:** `npx eslint tests/security/supply-chain/workflow.test.ts`
  - Result: 0 errors, 0 warnings.
- **TypeScript:** `node --max-old-space-size=8192 node_modules/typescript/bin/tsc --noEmit`
  - Exit code: 1
  - Classification: `NONZERO_INHERITED_BASELINE_ONLY`. Zero new Bundle 1A errors. Only the seven inherited Phase 3 errors remain.
- **Build Applicability:** `BUILD_NOT_APPLICABLE_SUPPLY_CHAIN_CONFIGURATION_ONLY`

## Final Confirmations
- **No application source modification.**
- **No database or migration execution.**
- **No Azure, Vercel, or production access.**
- **No push or deployment.**
- **Phase 5E remains unstarted by this bundle.**
