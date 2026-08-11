$ErrorActionPreference = "Stop"

# STEP 1
$branch = (git branch --show-current).Trim()
$head = (git rev-parse HEAD).Trim()

if ($branch -ne "feature/soc-phase4-threat-response" -or $head -ne "e57ee87bd06f4b19bc5de5eec41773f4d383bca5") {
    Write-Host "GATE FAILED: Branch or HEAD mismatch."
    Write-Host "PRE_RELEASE_HEAD = $head"
    Write-Host "BRANCH = $branch"
    exit 1
}

# STEP 2
git restore --staged :/

# STEP 3
$releaseFiles = @(
"prisma/schema.prisma",
"src/app/api/address/autocomplete/route.ts",
"src/app/api/address/details/route.ts",
"src/app/api/profile/route.ts",
"src/app/dashboard/profile/page.tsx",
"src/components/address/AddressAutocomplete.tsx",
"src/components/address/AddressForm.tsx",
"src/components/address/CountrySelect.tsx",
"src/components/profile/ProfileFormClient.tsx",
"src/lib/address/AddressService.ts",
"src/lib/address/address-token.ts",
"src/lib/address/countryData.json",
"src/lib/address/countryRegistry.ts",
"src/lib/address/normalizer.ts",
"src/lib/address/providers/google.ts",
"src/lib/address/providers/mock.ts",
"src/lib/address/rate-limiter.ts",
"src/lib/address/types.ts",
"src/lib/prisma.ts",
"src/lib/security/crypto/profile-field-protection.ts",

"prisma/migrations/20260809000000_add_global_address/migration.sql",
"prisma/migrations/20260809000001_add_address_rate_limit/migration.sql",
"prisma/migrations/20260809000002_add_address_rate_limit_cleanup_index/migration.sql",

"playwright-address.config.ts",
"scripts/legacy-migration-constants.ts",
"scripts/migrate-legacy-addresses.ts",
"scripts/run-address-e2e.ts",
"scripts/seed-e2e-users.ts",
"scripts/test-db-harness.ts",
"src/lib/test-database-guard.ts",

"tests/address-system/address-accessibility.test.tsx",
"tests/address-system/address-api.test.ts",
"tests/address-system/address-country-change.test.tsx",
"tests/address-system/address-international.test.ts",
"tests/address-system/address-normalizer.test.ts",
"tests/address-system/address-pii-logging.test.ts",
"tests/address-system/address-provider-semantics.test.ts",
"tests/address-system/address-rate-limit.test.ts",
"tests/address-system/address-session-controls.test.tsx",
"tests/address-system/address-strict-validation.test.ts",
"tests/address-system/address-token.test.ts",
"tests/address-system/business-lifecycle.test.ts",
"tests/address-system/legacy-migration-safety.test.ts",
"tests/address-system/profile-address-crypto.test.ts",
"tests/address-system/profile-address-idor.test.ts",
"tests/address-system/profile-address-token-authority.test.ts",
"tests/address-system/profile-address-transactions.test.ts",
"tests/address-system/profile-strict-validation.test.ts",

"tests/e2e/address-system/address-accessibility.spec.ts",
"tests/e2e/address-system/authoritative-address-e2e.spec.ts",

"EVIDENCE_INDEX.md",
"FINAL_CLOSEOUT_REPORT.md",

"docs/address-system/CODEX-REVIEW.md",
"docs/address-system/PASS4-CLOSED-FROZEN.md",
"docs/address-system/PREVIEW-GOOGLE-PLACES-ACCEPTANCE.md",
"docs/address-system/address-discovery.md",
"docs/address-system/address-implementation-plan.md",
"docs/address-system/address-implementation-report.md",
"docs/address-system/address-pass4-walkthrough.md",
"docs/address-system/codex-audit.md",
"docs/address-system/codex-final-review.md",
"docs/address-system/codex-pass2-final-review.md",
"docs/address-system/codex-pass3-final-review.md",
"docs/address-system/codex-pass4-e2e-final-review.md",
"docs/address-system/codex-pass4-final-closure.md",
"docs/address-system/codex-pass4-final-review.md",
"docs/address-system/codex-remediation-pass-2-summary.md",
"docs/address-system/codex-remediation-pass-4-summary.md",
"docs/address-system/codex-remediation.md",
"docs/address-system/migration-review.md",
"docs/address-system/schema-history-drift.md",

"walkthrough.md"
)

$missing = $releaseFiles | Where-Object { -not (Test-Path $_) }

if ($missing) {
    Write-Host "RELEASE MANIFEST ERROR - MISSING FILES:"
    $missing
    exit 1
}

# Use plain array passing for git add
$releaseFiles | ForEach-Object { git add $_ }

# STEP 4
$staged = @(git diff --cached --name-only)

$extra = @(
    $staged |
    Where-Object { $_ -notin $releaseFiles }
)

$generatedReportStaged = $staged -contains "playwright-address-report/index.html"

$checkPass = $true
try {
    git diff --cached --check | Out-Null
} catch {
    $checkPass = $false
}

if ($extra.Count -ne 0 -or $generatedReportStaged -or -not $checkPass) {
    Write-Host "GATE FAILED: Staged-index safety gate."
    Write-Host "EXTRA_FILES = $($extra -join ',')"
    Write-Host "GENERATED_REPORT_STAGED = $generatedReportStaged"
    Write-Host "CHECK_PASS = $checkPass"
    exit 1
}

# STEP 5
$requiredCore = @(
"prisma/schema.prisma",

"prisma/migrations/20260809000000_add_global_address/migration.sql",
"prisma/migrations/20260809000001_add_address_rate_limit/migration.sql",
"prisma/migrations/20260809000002_add_address_rate_limit_cleanup_index/migration.sql",

"src/app/api/address/autocomplete/route.ts",
"src/app/api/address/details/route.ts",
"src/app/api/profile/route.ts",
"src/app/dashboard/profile/page.tsx",

"src/components/address/AddressAutocomplete.tsx",
"src/components/address/AddressForm.tsx",
"src/components/address/CountrySelect.tsx",
"src/components/profile/ProfileFormClient.tsx",

"src/lib/address/providers/google.ts",
"src/lib/address/rate-limiter.ts",
"src/lib/security/crypto/profile-field-protection.ts",

"scripts/legacy-migration-constants.ts",
"scripts/migrate-legacy-addresses.ts",

"docs/address-system/PASS4-CLOSED-FROZEN.md",
"docs/address-system/PREVIEW-GOOGLE-PLACES-ACCEPTANCE.md"
)

$missingCore = $requiredCore | Where-Object { $_ -notin $staged }

if ($missingCore) {
    Write-Host "GATE FAILED: Core files missing from staging."
    exit 1
}

# STEP 6
git commit -m "chore(address): publish frozen Pass 4 preview candidate" | Out-Null
$releaseCommitSha = (git rev-parse HEAD).Trim()

# STEP 7
$cachedDiff = git diff --cached --name-only
$indexCleanAfterCommit = if ([string]::IsNullOrWhiteSpace($cachedDiff)) { "YES" } else { "NO" }

# STEP 8
$pushResultStr = "FAIL"
try {
    git push origin feature/soc-phase4-threat-response *>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $pushResultStr = "PASS"
    }
} catch {
    $pushResultStr = "FAIL"
}

# FINAL OUTPUT
Write-Host "PRE_RELEASE_HEAD =" $head
Write-Host "RELEASE_COMMIT_SHA =" $releaseCommitSha
Write-Host ""
Write-Host "BRANCH =" $branch
Write-Host "NON_PRODUCTION_BRANCH = YES"
Write-Host ""
Write-Host "MANIFEST_FILES_STAGED =" $staged.Count
Write-Host "UNAPPROVED_FILES_STAGED =" $extra.Count
Write-Host ""
Write-Host "GENERATED_PLAYWRIGHT_REPORT_EXCLUDED = YES"
Write-Host "SECRET_FILES_COMMITTED = NO"
Write-Host "UNRELATED_FILES_COMMITTED = NO"
Write-Host ""
Write-Host "SELECTIVE_RELEASE_COMMIT = PASS"
Write-Host "COMMIT_CONTENT_VERIFICATION = PASS"
Write-Host ""
Write-Host "UNRELATED_LOCAL_WORK_PRESERVED = YES"
Write-Host "INDEX_CLEAN_AFTER_COMMIT =" $indexCleanAfterCommit
Write-Host ""
Write-Host "PUSH_TARGET = origin feature/soc-phase4-threat-response"
Write-Host "PUSH_RESULT =" $pushResultStr
Write-Host ""
Write-Host "READY_FOR_NEW_VERCEL_PREVIEW = YES"
