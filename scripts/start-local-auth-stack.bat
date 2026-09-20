@echo off
setlocal
echo ====================================================
echo RENTipid - Starting Local Development Auth Stack
echo ====================================================

REM 1. Check certificates
if not exist ".certs\local.rentipid.com.ph.pem" (
    echo [ERROR] Missing .certs\local.rentipid.com.ph.pem
    exit /b 1
)
if not exist ".certs\local.rentipid.com.ph.key" (
    echo [ERROR] Missing .certs\local.rentipid.com.ph.key
    exit /b 1
)

REM 2. Check Next.js dev server on port 3000
netstat -ano | findstr /R ":3000.*LISTENING" >nul
if %errorlevel% neq 0 (
    echo [1/3] Starting Next.js dev server on 127.0.0.1:3000...
    powershell -Command "Start-Process npm -ArgumentList 'run dev' -WindowStyle Minimized"
    ping 127.0.0.1 -n 6 >nul
) else (
    echo [1/3] Next.js dev server is already running on port 3000.
)

REM 3. Check Local HTTPS Proxy on port 443
netstat -ano | findstr /R ":443.*LISTENING" >nul
if %errorlevel% neq 0 (
    echo [2/3] Starting Local HTTPS proxy on 127.0.0.1:443...
    powershell -Command "Start-Process node -ArgumentList 'scratch/local-https-proxy.js' -WorkingDirectory '%cd%' -WindowStyle Minimized"
    ping 127.0.0.1 -n 4 >nul
) else (
    echo [2/3] Local HTTPS proxy is already running on port 443.
)

REM 4. Check Health Endpoint
echo [3/3] Checking https://preview.rentipid.com.ph/api/health...
node scripts\check-local-health.js preview.rentipid.com.ph

echo.
echo Local Auth Stack is READY on https://preview.rentipid.com.ph (and https://local.rentipid.com.ph)
endlocal
