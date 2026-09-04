# RENTipid Antigravity Session Restore Script
# Branch: fix/listingbridge-v1.1-rights-media-readiness
# Checkpoint: checkpoint-listingbridge-v1.1-g11-category-reconciled

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  RENTipid Antigravity Session Verification & Restore" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$CurrentBranch = git rev-parse --abbrev-ref HEAD
$CurrentCommit = git rev-parse HEAD
$ExpectedBranch = "fix/listingbridge-v1.1-rights-media-readiness"

Write-Host "Current Branch: $CurrentBranch"
Write-Host "Current Commit: $CurrentCommit"

if ($CurrentBranch -ne $ExpectedBranch) {
    Write-Host "[WARNING] Current branch is not $ExpectedBranch. Checking out expected branch..." -ForegroundColor Yellow
    git checkout $ExpectedBranch
}

Write-Host "`n--- Git Working Tree Status ---" -ForegroundColor Green
git status --short

Write-Host "`n--- Checking Production Health (https://www.rentipid.com.ph/api/health) ---" -ForegroundColor Green
try {
    $health = Invoke-RestMethod -Uri "https://www.rentipid.com.ph/api/health" -Method Get -TimeoutSec 10
    Write-Host "Health Status: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Production health check failed: $_" -ForegroundColor Red
}

Write-Host "`n--- Active Context Summary ---" -ForegroundColor Cyan
Write-Host "Module: ListingBridge v1.1 (G11)"
Write-Host "Category Fix Commit: 843166351f582792fe93d75e33eeba72eb0dea7d"
Write-Host "Evidence Commit:     e7edbb9e38faa2fc151f2dd5c34ec1078fde4a95"
Write-Host "Production Deploy:   dpl_F21Q2K9kd2or86QmFF8BXfN1LHHK"
Write-Host "Rollback Deploy:     dpl_6AeYjKkdJpta2SQLfXaEexMR9Pux"
Write-Host "Database Branch:     holy-shape-01357429 / rentipid-production (br-proud-sunset-ap0ofil2)"
Write-Host "Categories Count:    15 (Reconciled & Idempotent)"
Write-Host "Current Gate:        LISTINGBRIDGE_G11 = HOLD"
Write-Host "Next Action:         Owner clicks 'Create RENTipid Draft' on existing READY_FOR_DRAFT job on https://www.rentipid.com.ph/dashboard/provider/listings/import"
Write-Host "==================================================" -ForegroundColor Cyan
