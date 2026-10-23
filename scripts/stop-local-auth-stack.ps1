# RENTipid Local Auth Stack Stop Script

Write-Host "Stopping Local HTTPS proxy..." -ForegroundColor Yellow
$connections = Get-NetTCPConnection -LocalPort 443 -ErrorAction SilentlyContinue
if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped proxy process PID: $p" -ForegroundColor Green
    }
} else {
    Write-Host "No process listening on port 443." -ForegroundColor Gray
}

Write-Host "Local HTTPS proxy stopped successfully." -ForegroundColor Cyan
