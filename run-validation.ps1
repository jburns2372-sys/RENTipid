$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
$rng.GetBytes($bytes)
$env:PRIVACY_FIELD_ENCRYPTION_KEY_B64 = [Convert]::ToBase64String($bytes)

Write-Host "--- DB GUARD ---"
npm run test:db:guard
$dbGuardExit = $LASTEXITCODE

Write-Host "--- PRISMA VALIDATE ---"
npx prisma validate
$prismaValidateExit = $LASTEXITCODE

Write-Host "--- PRISMA GENERATE ---"
npx prisma generate
$prismaGenerateExit = $LASTEXITCODE

Write-Host "--- TSC ---"
npx tsc --noEmit
$tscExit = $LASTEXITCODE

Write-Host "--- LINT ---"
$c3Files = Get-Content docs/final-documentation/privacy-module/PHASE_6ZD_C3_VALIDATED_FILE_SET.txt
$c3LintFiles = $c3Files | Where-Object { $_ -match '\.tsx?$' }
npx eslint --max-warnings=0 $c3LintFiles
$lintExit = $LASTEXITCODE

Write-Host "--- PRIVACY TESTS ---"
npm run test:soc:integration -- tests/privacy/ --runInBand
$privacyTestExit = $LASTEXITCODE

Write-Host "--- SECURITY TESTS ---"
npm run test:soc:integration -- tests/security/soc-gate4g.test.ts tests/security/rules/phase3-lifecycle.integration.test.ts
$securityTestExit = $LASTEXITCODE

Write-Host "--- PLAYWRIGHT ---"
npx playwright test tests/e2e/privacy-v1.spec.ts
$playwrightExit = $LASTEXITCODE

Write-Host "--- BUILD ---"
npm run build
$buildExit = $LASTEXITCODE

Remove-Item Env:PRIVACY_FIELD_ENCRYPTION_KEY_B64

Write-Host "=== RESULTS ==="
Write-Host "TEST_DATABASE_GUARD_EXIT_CODE: $dbGuardExit"
Write-Host "PRISMA_VALIDATE_EXIT_CODE: $prismaValidateExit"
Write-Host "PRISMA_GENERATE_EXIT_CODE: $prismaGenerateExit"
Write-Host "TYPESCRIPT_EXIT_CODE: $tscExit"
Write-Host "PRIVACY_LINT_EXIT_CODE: $lintExit"
Write-Host "PRIVACY_TEST_EXIT_CODE: $privacyTestExit"
Write-Host "SECURITY_TEST_EXIT_CODE: $securityTestExit"
Write-Host "PLAYWRIGHT_EXIT_CODE: $playwrightExit"
Write-Host "BUILD_EXIT_CODE: $buildExit"
