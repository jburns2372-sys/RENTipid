$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$lines = Get-Content $hostsPath | Where-Object { $_ -notmatch 'preview\.rentipid\.com\.ph' -and $_ -notmatch 'local\.rentipid\.com\.ph' }
Set-Content -Path $hostsPath -Value $lines
ipconfig /flushdns
Write-Host "Hosts restored to public DNS!"
Start-Sleep -Seconds 2
