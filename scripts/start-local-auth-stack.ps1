# RENTipid Local Auth Stack Launcher
# Binds strictly to loopback (127.0.0.1)

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "RENTipid — Starting Local Development Auth Stack" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Verify certificates
$certPath = ".certs/local.rentipid.com.ph.pem"
$keyPath = ".certs/local.rentipid.com.ph.key"
if (!(Test-Path $certPath) -or !(Test-Path $keyPath)) {
    Write-Error "Missing TLS certificates in .certs/ folder."
    exit 1
}

# 2. Check Next.js dev server on port 3000
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if (!$port3000) {
    Write-Host "[1/3] Starting Next.js dev server on 127.0.0.1:3000..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "run dev" -NoNewWindow
    Start-Sleep -Seconds 5
} else {
    Write-Host "[1/3] Next.js dev server is already running on port 3000." -ForegroundColor Green
}

# 3. Check Proxy on port 443
$port443 = Get-NetTCPConnection -LocalPort 443 -ErrorAction SilentlyContinue
if (!$port443) {
    Write-Host "[2/3] Starting Local HTTPS proxy on 127.0.0.1:443..." -ForegroundColor Yellow
    Start-Process -FilePath "node" -ArgumentList "scratch/local-https-proxy.js" -NoNewWindow
    Start-Sleep -Seconds 2
} else {
    Write-Host "[2/3] Local HTTPS proxy is already running on port 443." -ForegroundColor Green
}

# 4. Verify Health Endpoint
Write-Host "[3/3] Checking https://local.rentipid.com.ph/api/health..." -ForegroundColor Yellow
node scripts/check-local-health.js

Write-Host "Local Auth Stack is READY on https://local.rentipid.com.ph" -ForegroundColor Cyan
