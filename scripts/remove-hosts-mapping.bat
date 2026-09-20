@echo off
echo Requesting administrator privilege to remove local mappings from hosts file...
powershell -Command "Start-Process powershell -ArgumentList '-NoProfile -Command \"(Get-Content $env:SystemRoot\System32\drivers\etc\hosts) | Where-Object { `$_ -notmatch 'preview.rentipid.com.ph' -and `$_ -notmatch 'local.rentipid.com.ph' } | Set-Content $env:SystemRoot\System32\drivers\etc\hosts; ipconfig /flushdns; Write-Host `\"Hosts file restored!`\"\"' -Verb RunAs"
echo Done.
