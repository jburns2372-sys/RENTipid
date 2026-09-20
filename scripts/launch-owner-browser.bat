@echo off
echo Starting Chrome for RENTipid Local Multi-Login Authentication...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --host-resolver-rules="MAP preview.rentipid.com.ph 127.0.0.1, MAP local.rentipid.com.ph 127.0.0.1" --user-data-dir="C:\Users\user\.gemini\antigravity-ide\rentipid-chrome-profile" "https://preview.rentipid.com.ph/login"
echo Chrome launched to https://preview.rentipid.com.ph/login
