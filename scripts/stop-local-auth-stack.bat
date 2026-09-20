@echo off
echo ====================================================
echo RENTipid - Stopping Local Development Auth Stack
echo ====================================================

REM Stop process on port 443 (Local HTTPS Proxy)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":443" ^| findstr "LISTENING"') do (
    echo Stopping Local HTTPS Proxy process PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Local HTTPS proxy stopped successfully.
