@echo off
echo Requesting administrator privilege to map preview.rentipid.com.ph to 127.0.0.1 in hosts file...
powershell -Command "Start-Process powershell -ArgumentList '-NoProfile -Command \"Add-Content -Path $env:SystemRoot\System32\drivers\etc\hosts -Value `\"127.0.0.1 preview.rentipid.com.ph local.rentipid.com.ph`\"; Write-Host `\"Hosts mapped successfully! Refreshing DNS...`\"; ipconfig /flushdns\"' -Verb RunAs"
echo Done.
