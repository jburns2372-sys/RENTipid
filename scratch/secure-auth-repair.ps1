$ErrorActionPreference = "Stop"

$Host.UI.RawUI.WindowTitle = "RENTipid Secure Credential Input"
Clear-Host

# ---------------------------------------------------------
# STRUCTURE VALIDATOR
# ---------------------------------------------------------
function Validate-CredentialStructure {
    param (
        [string]$Url,
        [string]$ExpectedDb
    )

    $TrimmedUrl = $Url.Trim().TrimEnd("`r", "`n")
    
    $passUriParse = $false
    $passScheme = $false
    $passHost = $false
    $passNeonHost = $false
    $passPooledHost = $false
    $passUser = $false
    $passPassword = $false
    $passDbPath = $false
    $passDbMatch = $false

    try {
        $Uri = [System.Uri]::new($TrimmedUrl)
        $passUriParse = $true
        
        if ($Uri.Scheme -match "^postgres(ql)?$") { $passScheme = $true }
        if (-not [string]::IsNullOrWhiteSpace($Uri.Host)) { $passHost = $true }
        if ($Uri.Host -match "\.neon\.tech$") { $passNeonHost = $true }
        if ($Uri.Host -match "pooler") { $passPooledHost = $true }
        
        $UserInfo = $Uri.UserInfo -split ':', 2
        if ($UserInfo.Count -gt 0 -and -not [string]::IsNullOrWhiteSpace($UserInfo[0])) { $passUser = $true }
        if ($UserInfo.Count -gt 1 -and -not [string]::IsNullOrWhiteSpace($UserInfo[1])) { $passPassword = $true }
        
        $DbName = [System.Uri]::UnescapeDataString($Uri.AbsolutePath).TrimStart('/')
        if (-not [string]::IsNullOrWhiteSpace($DbName)) { $passDbPath = $true }
        if ($DbName -eq $ExpectedDb) { $passDbMatch = $true }
        
    } catch {
        $passUriParse = $false
    }

    $allPassed = ($passUriParse -and $passScheme -and $passHost -and $passNeonHost -and $passPooledHost -and $passUser -and $passPassword -and $passDbPath -and $passDbMatch)

    return @{
        Passed = $allPassed
        Results = [ordered]@{
            "URI_PARSE" = if($passUriParse){"PASS"}else{"FAIL"}
            "SCHEME_VALID" = if($passScheme){"PASS"}else{"FAIL"}
            "HOST_PRESENT" = if($passHost){"PASS"}else{"FAIL"}
            "NEON_HOST" = if($passNeonHost){"PASS"}else{"FAIL"}
            "POOLED_HOST" = if($passPooledHost){"PASS"}else{"FAIL"}
            "USER_PRESENT" = if($passUser){"PASS"}else{"FAIL"}
            "PASSWORD_PRESENT" = if($passPassword){"PASS"}else{"FAIL"}
            "DATABASE_PATH" = if($passDbPath){"PASS"}else{"FAIL"}
            "DATABASE_TARGET" = if($passDbMatch){"MATCH"}else{"FAIL"}
        }
    }
}

# ---------------------------------------------------------
# VALIDATOR SELF-TEST
# ---------------------------------------------------------
if ($env:RUN_SELF_TEST -eq "1") {
    $syntheticUrl = "postgresql://fake_user:fake_password@ep-example-pooler.example.neon.tech/fake_db?sslmode=require"
    $selfTest = Validate-CredentialStructure -Url $syntheticUrl -ExpectedDb "fake_db"
    
    if ($selfTest.Passed) {
        Write-Output "VALIDATOR_SELF_TEST: PASS"
        exit 0
    } else {
        Write-Output "VALIDATOR_SELF_TEST: FAIL"
        foreach ($key in $selfTest.Results.Keys) {
            Write-Output "$($key): $($selfTest.Results[$key])"
        }
        exit 1
    }
}

# ---------------------------------------------------------
# PLUMBING SELF-TEST
# ---------------------------------------------------------
if ($env:RUN_PLUMBING_SELF_TEST -eq "1") {
    $DiagnosticDir = "C:\Users\user\Documents\JD SOFTWARE PROJECTS\RENTipid-RESTORE-POINTS\preview-db-final-isolation-20260820-185159"
    $TestCjs = Join-Path $DiagnosticDir "scratch-plumbing-test.cjs"
    $TestStdOut = Join-Path $DiagnosticDir "plumbing-stdout.tmp"
    $TestStdErr = Join-Path $DiagnosticDir "plumbing-stderr.tmp"

    $TestScript = @'
console.log(JSON.stringify({
    ok: true,
    code: null
}));
'@
    $TestScript | Out-File $TestCjs -Encoding utf8

    $NodeExe = "C:\nvm4w\nodejs\node.exe"

    $testProcessPass = $false
    try {
        $Process = Start-Process -FilePath $NodeExe -ArgumentList "`"$TestCjs`"" -NoNewWindow -Wait -PassThru -RedirectStandardOutput $TestStdOut -RedirectStandardError $TestStdErr
        $testProcessPass = $true
    } catch {}
    
    $testStdOutText = ""
    $testCapturePass = $false
    if (Test-Path $TestStdOut) {
        $testStdOutText = [System.IO.File]::ReadAllText($TestStdOut).Trim()
        $testCapturePass = (-not [string]::IsNullOrWhiteSpace($testStdOutText))
    }

    $testJsonPass = $false
    if ($testCapturePass) {
        try {
            $lines = $testStdOutText -replace "`r", "" -split "`n"
            $jsonLine = $lines | Where-Object { $_ -match '^{.*}$' } | Select-Object -Last 1
            if ($jsonLine) {
                $testParsed = $jsonLine | ConvertFrom-Json
                $testJsonPass = ($testParsed.ok -eq $true)
            }
        } catch {}
    }

    Remove-Item $TestCjs -Force -ErrorAction SilentlyContinue
    Remove-Item $TestStdOut -Force -ErrorAction SilentlyContinue
    Remove-Item $TestStdErr -Force -ErrorAction SilentlyContinue

    if ($testProcessPass -and $testCapturePass -and $testJsonPass) {
        Write-Output "NODE_PROCESS_SELF_TEST: PASS"
        Write-Output "STDOUT_CAPTURE_SELF_TEST: PASS"
        Write-Output "JSON_PARSE_SELF_TEST: PASS"
        exit 0
    } else {
        Write-Output "NODE_PROCESS_SELF_TEST: $(if($testProcessPass){'PASS'}else{'FAIL'})"
        Write-Output "STDOUT_CAPTURE_SELF_TEST: $(if($testCapturePass){'PASS'}else{'FAIL'})"
        Write-Output "JSON_PARSE_SELF_TEST: $(if($testJsonPass){'PASS'}else{'FAIL'})"
        exit 1
    }
}


Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "RENTipid - PREVIEW DATABASE AUTHENTICATION REPAIR" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open Neon."
Write-Host "Select:"
Write-Host "Branch: preview-insurance"
Write-Host "Database: rentipid_preview"
Write-Host "Connection: POOLED"
Write-Host "Click Connect."
Write-Host "Copy the ENTIRE freshly generated PostgreSQL connection string exactly as Neon provides it."
Write-Host ""
Write-Host "Make sure it is in your Windows Clipboard."
Write-Host "Press ENTER when ready to read from clipboard..."
$null = Read-Host

$PlainUrl = Get-Clipboard -Raw
if ([string]::IsNullOrWhiteSpace($PlainUrl)) {
    Write-Host "CLIPBOARD_INPUT: EMPTY" -ForegroundColor Red
    Write-Host "Press any key to exit." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    exit
} else {
    Write-Host "CLIPBOARD_INPUT: PRESENT" -ForegroundColor Green
}

# Trim and clear clipboard
$TrimmedUrl = $PlainUrl.Trim().TrimEnd("`r", "`n")
try { Set-Clipboard -Value " " } catch { }
$PlainUrl = $null

$ResultFile = "C:\Users\user\AppData\Local\Temp\auth_repair_result.txt"
Remove-Item $ResultFile -Force -ErrorAction SilentlyContinue | Out-Null

$ValidationResult = Validate-CredentialStructure -Url $TrimmedUrl -ExpectedDb "rentipid_preview"

if (-not $ValidationResult.Passed) {
    Write-Output "CREDENTIAL_STRUCTURE: FAIL" | Out-File $ResultFile
    Write-Host "CREDENTIAL_STRUCTURE: FAIL" -ForegroundColor Red
    
    foreach ($key in $ValidationResult.Results.Keys) {
        Write-Output "$($key): $($ValidationResult.Results[$key])" | Out-File $ResultFile -Append
        Write-Host "$($key): $($ValidationResult.Results[$key])" -ForegroundColor Red
    }
    
    $TrimmedUrl = $null
    
    Write-Host "Press any key to exit." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    exit
}

Write-Output "CREDENTIAL_STRUCTURE: PASS" | Out-File $ResultFile
Write-Host "CREDENTIAL_STRUCTURE: PASS" -ForegroundColor Green

# Step 2 - Vercel Env Update
Write-Host "Updating Vercel Preview DATABASE_URL..." -ForegroundColor Cyan

$NodeExe = "C:\nvm4w\nodejs\node.exe"
$Npx = "C:\nvm4w\nodejs\node_modules\npm\bin\npx-cli.js"

# Check if DATABASE_URL exists in preview
$LsProcess = Start-Process -FilePath $NodeExe -ArgumentList "`"$Npx`" --yes vercel env ls preview" -NoNewWindow -Wait -PassThru -RedirectStandardOutput "vercel_stdout.tmp" -RedirectStandardError "vercel_stderr.tmp"
$EnvExists = $false
if (Test-Path "vercel_stdout.tmp") {
    $Stdout = Get-Content "vercel_stdout.tmp" -Raw
    if ($Stdout -match "DATABASE_URL") {
        $EnvExists = $true
    }
}
Remove-Item "vercel_stdout.tmp" -Force -ErrorAction SilentlyContinue
Remove-Item "vercel_stderr.tmp" -Force -ErrorAction SilentlyContinue

$verb = if ($EnvExists) { "update" } else { "add" }

$StartInfo = [System.Diagnostics.ProcessStartInfo]::new()
$StartInfo.FileName = $NodeExe
$StartInfo.Arguments = "`"$Npx`" --yes vercel env $verb DATABASE_URL preview"
$StartInfo.RedirectStandardInput = $true
$StartInfo.RedirectStandardOutput = $true
$StartInfo.RedirectStandardError = $true
$StartInfo.UseShellExecute = $false
$StartInfo.CreateNoWindow = $true

$Process = [System.Diagnostics.Process]::Start($StartInfo)
$Process.StandardInput.WriteLine($TrimmedUrl)
$Process.StandardInput.Close()

$Process.WaitForExit()
$ExitCode = $Process.ExitCode

if ($ExitCode -eq 0) {
    Write-Output "VERCEL_PREVIEW_DATABASE_URL_UPDATE: PASS" | Out-File $ResultFile -Append
    Write-Host "VERCEL_PREVIEW_DATABASE_URL_UPDATE: PASS" -ForegroundColor Green
} else {
    Write-Output "VERCEL_PREVIEW_DATABASE_URL_UPDATE: FAIL" | Out-File $ResultFile -Append
    Write-Output "VERCEL_UPDATE_EXIT_CODE: $ExitCode" | Out-File $ResultFile -Append
    Write-Host "VERCEL_PREVIEW_DATABASE_URL_UPDATE: FAIL" -ForegroundColor Red
    Write-Host "VERCEL_UPDATE_EXIT_CODE: $ExitCode" -ForegroundColor Red
}

# Verify metadata only
$LsProcess2 = Start-Process -FilePath $NodeExe -ArgumentList "`"$Npx`" --yes vercel env ls preview" -NoNewWindow -Wait -PassThru -RedirectStandardOutput "vercel_stdout2.tmp" -RedirectStandardError "vercel_stderr2.tmp"
$EnvExistsAfter = $false
if (Test-Path "vercel_stdout2.tmp") {
    $Stdout2 = Get-Content "vercel_stdout2.tmp" -Raw
    if ($Stdout2 -match "DATABASE_URL") {
        $EnvExistsAfter = $true
    }
}
Remove-Item "vercel_stdout2.tmp" -Force -ErrorAction SilentlyContinue
Remove-Item "vercel_stderr2.tmp" -Force -ErrorAction SilentlyContinue

if ($EnvExistsAfter) {
    Write-Output "PREVIEW_DATABASE_URL_PRESENT_AFTER: YES" | Out-File $ResultFile -Append
    Write-Output "PREVIEW_SCOPE: PASS" | Out-File $ResultFile -Append
    Write-Host "PREVIEW_DATABASE_URL_PRESENT_AFTER: YES" -ForegroundColor Green
    Write-Host "PREVIEW_SCOPE: PASS" -ForegroundColor Green
} else {
    Write-Output "PREVIEW_DATABASE_URL_PRESENT_AFTER: NO" | Out-File $ResultFile -Append
    Write-Output "PREVIEW_SCOPE: FAIL" | Out-File $ResultFile -Append
    Write-Host "PREVIEW_DATABASE_URL_PRESENT_AFTER: NO" -ForegroundColor Red
    Write-Host "PREVIEW_SCOPE: FAIL" -ForegroundColor Red
}


$env:RENTIPID_SECURE_DATABASE_URL = $null
$TrimmedUrl = $null

Write-Host ""
Write-Host "Process completed. Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
