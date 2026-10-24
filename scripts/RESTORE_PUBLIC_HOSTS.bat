@echo off
echo ====================================================
echo RENTipid - Restore Public Hosts (Remove 127.0.0.1 mapping)
echo ====================================================
echo.
powershell -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0restore-hosts.ps1\"' -Verb RunAs"
