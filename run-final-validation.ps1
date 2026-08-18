
$ErrorActionPreference = "Stop"
$env:PRIVACY_ENCRYPTION_KEY_SECRET = (node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

Write-Host "--- TEST DB GUARD ---"
npm run test:db:guard
$guardExit = $LASTEXITCODE

Write-Host "--- PRISMA VALIDATE ---"
npx prisma validate
$validateExit = $LASTEXITCODE

Write-Host "--- PRISMA GENERATE ---"
npx prisma generate
$generateExit = $LASTEXITCODE

Write-Host "--- TSC ---"
npx tsc --noEmit
$tscExit = $LASTEXITCODE

Write-Host "--- ESLINT ---"
$c3Files = Get-Content docs/final-documentation/privacy-module/PHASE_6ZD_C3_VALIDATED_FILE_SET.txt
$c3LintFiles = $c3Files | Where-Object { $_ -match "\.tsx?`$" }
npx eslint --max-warnings=0 $c3LintFiles
$eslintExit = $LASTEXITCODE

Write-Host "--- PRIVACY TESTS ---"
npm run test:soc:integration -- tests/privacy/ --runInBand
$privacyExit = $LASTEXITCODE

Write-Host "--- SECURITY TESTS ---"
npm run test:soc:integration -- tests/security/soc-gate4g.test.ts tests/security/rules/phase3-lifecycle.integration.test.ts
$securityExit = $LASTEXITCODE

Write-Host "--- PLAYWRIGHT ---"
npx playwright test tests/e2e/privacy-v1.spec.ts
$playwrightExit = $LASTEXITCODE

Write-Host "--- BUILD ---"
npm run build
$buildExit = $LASTEXITCODE

# Unset key
Remove-Item Env:\PRIVACY_ENCRYPTION_KEY_SECRET -ErrorAction SilentlyContinue

Write-Host "RESULTS:"
Write-Host "TEST_DATABASE_GUARD_EXIT_CODE=$guardExit"
Write-Host "PRISMA_VALIDATE_EXIT_CODE=$validateExit"
Write-Host "PRISMA_GENERATE_EXIT_CODE=$generateExit"
Write-Host "TYPESCRIPT_EXIT_CODE=$tscExit"
Write-Host "C3_LINT_EXIT_CODE=$eslintExit"
Write-Host "PRIVACY_TEST_EXIT_CODE=$privacyExit"
Write-Host "SECURITY_TEST_EXIT_CODE=$securityExit"
Write-Host "PLAYWRIGHT_EXIT_CODE=$playwrightExit"
Write-Host "BUILD_EXIT_CODE=$buildExit"

