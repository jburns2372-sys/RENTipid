[CmdletBinding()]
param(
    [string]$Server = 'rentipid-p17-rehearsal-07290921.postgres.database.azure.com',
    [string]$EvidenceZipPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$PermittedServer = 'rentipid-p17-rehearsal-07290921.postgres.database.azure.com'
$RejectedProductionServer = 'rentipid-postgres-db.postgres.database.azure.com'
$DatabaseName = 'rentipid_db'
$AdminUser = 'rentipid_admin'
$ReadOnlyUser = 'rentipid_phase17_readonly'
$ReadyMarker = 'PHASE17_PRE_REMEDIATION_READY'
$BlockedMarker = 'PHASE17_PRE_REMEDIATION_BLOCKED'

function Assert-RehearsalServer {
    param([Parameter(Mandatory)][string]$HostName)

    if ($HostName.IndexOf(
            $RejectedProductionServer,
            [System.StringComparison]::OrdinalIgnoreCase
        ) -ge 0) {
        throw 'Production hostname is explicitly prohibited.'
    }

    if ($HostName.IndexOf(
            'p17-rehearsal',
            [System.StringComparison]::OrdinalIgnoreCase
        ) -lt 0) {
        throw 'Server hostname does not contain the required p17-rehearsal marker.'
    }

    if (-not $HostName.Equals(
            $PermittedServer,
            [System.StringComparison]::OrdinalIgnoreCase
        )) {
        throw 'Server hostname is not the hard-coded PHASE17 rehearsal server.'
    }
}

function Find-PsqlExecutable {
    $command = Get-Command 'psql.exe' -ErrorAction SilentlyContinue
    if ($null -ne $command) {
        return $command.Source
    }

    $searchRoots = @(
        (Join-Path $env:ProgramFiles 'PostgreSQL')
    )

    if (${env:ProgramFiles(x86)}) {
        $searchRoots += Join-Path ${env:ProgramFiles(x86)} 'PostgreSQL'
    }

    foreach ($root in $searchRoots) {
        if (-not (Test-Path -LiteralPath $root -PathType Container)) {
            continue
        }

        $versions = Get-ChildItem -LiteralPath $root -Directory |
            Sort-Object Name -Descending

        foreach ($version in $versions) {
            $candidate = Join-Path $version.FullName 'bin\psql.exe'
            if (Test-Path -LiteralPath $candidate -PathType Leaf) {
                return $candidate
            }
        }
    }

    throw 'psql.exe was not found in PATH or a standard PostgreSQL installation.'
}

function Set-PgPasswordFromSecureString {
    param([Parameter(Mandatory)][Security.SecureString]$SecurePassword)

    $bstr = [IntPtr]::Zero
    try {
        $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR(
            $SecurePassword
        )
        $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR(
            $bstr
        )
    }
    finally {
        if ($bstr -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
        }
    }
}

function Clear-PgPassword {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

function Invoke-PsqlScript {
    param(
        [Parameter(Mandatory)][string]$PsqlPath,
        [Parameter(Mandatory)][string]$HostName,
        [Parameter(Mandatory)][string]$Database,
        [Parameter(Mandatory)][string]$UserName,
        [Parameter(Mandatory)][Security.SecureString]$SecurePassword,
        [Parameter(Mandatory)][string]$SqlFile,
        [Parameter(Mandatory)][string]$EvidenceDirectory,
        [Parameter(Mandatory)][string]$EvidenceName,
        [hashtable]$Variables = @{}
    )

    $stdoutPath = Join-Path $EvidenceDirectory "$EvidenceName.stdout.txt"
    $stderrPath = Join-Path $EvidenceDirectory "$EvidenceName.stderr.txt"
    $arguments = @(
        '--no-psqlrc',
        '--no-password',
        "--host=$HostName",
        '--port=5432',
        "--dbname=$Database",
        "--username=$UserName",
        '--set=ON_ERROR_STOP=1'
    )

    foreach ($name in ($Variables.Keys | Sort-Object)) {
        $value = [string]$Variables[$name]
        if ($value -match '[\r\n]') {
            throw "Invalid newline in psql variable $name."
        }
        $arguments += "--set=$name=$value"
    }

    $arguments += "--file=`"$SqlFile`""

    Set-PgPasswordFromSecureString -SecurePassword $SecurePassword
    try {
        $process = Start-Process `
            -FilePath $PsqlPath `
            -ArgumentList $arguments `
            -NoNewWindow `
            -Wait `
            -PassThru `
            -RedirectStandardOutput $stdoutPath `
            -RedirectStandardError $stderrPath
    }
    finally {
        Clear-PgPassword
    }

    $stdout = if (Test-Path -LiteralPath $stdoutPath) {
        Get-Content -LiteralPath $stdoutPath -Raw
    }
    else {
        ''
    }

    $stderr = if (Test-Path -LiteralPath $stderrPath) {
        Get-Content -LiteralPath $stderrPath -Raw
    }
    else {
        ''
    }

    [PSCustomObject]@{
        ExitCode = $process.ExitCode
        StdOut = $stdout
        StdErr = $stderr
        StdOutPath = $stdoutPath
        StdErrPath = $stderrPath
    }
}

function Expand-AndVerifyPackage {
    param(
        [Parameter(Mandatory)][string]$ZipPath,
        [Parameter(Mandatory)][string]$DetachedChecksumPath,
        [Parameter(Mandatory)][string]$Destination,
        [Parameter(Mandatory)][string]$EvidenceDirectory
    )

    $detachedLine = (Get-Content -LiteralPath $DetachedChecksumPath -Raw).Trim()
    if ($detachedLine -notmatch
        '^([0-9a-f]{64})  phase17-execution-package\.zip$') {
        throw 'Detached ZIP checksum format is invalid.'
    }

    $expectedZipHash = $Matches[1]
    $actualZipHash = (Get-FileHash -LiteralPath $ZipPath -Algorithm SHA256).
        Hash.ToLowerInvariant()

    if ($actualZipHash -ne $expectedZipHash) {
        throw 'Detached ZIP checksum verification failed.'
    }

    Expand-Archive -LiteralPath $ZipPath -DestinationPath $Destination

    $checksumPath = Join-Path `
        $Destination `
        'scripts\phase17_authorized_checksums.sha256'

    if (-not (Test-Path -LiteralPath $checksumPath -PathType Leaf)) {
        throw 'Internal checksum file is missing from the extracted package.'
    }

    $authorizedEntries = [Collections.Generic.List[string]]::new()
    $verifiedCount = 0

    foreach ($line in Get-Content -LiteralPath $checksumPath) {
        if (-not $line.Trim()) {
            continue
        }

        if ($line -notmatch '^([0-9a-f]{64})  (.+)$') {
            throw "Invalid internal checksum line: $line"
        }

        $expectedHash = $Matches[1]
        $relativePath = $Matches[2].Replace('\', '/')

        if ($relativePath -eq
            'scripts/phase17_authorized_checksums.sha256') {
            throw 'Internal checksum file must not hash itself.'
        }

        if ($relativePath -in @(
                'phase17-execution-package.zip',
                'phase17-execution-package.zip.sha256'
            )) {
            throw 'Archive or detached checksum is incorrectly self-referenced.'
        }

        if ($relativePath.StartsWith('/') -or
            $relativePath.Split('/') -contains '..') {
            throw "Unsafe payload path: $relativePath"
        }

        $target = Join-Path $Destination $relativePath.Replace('/', '\')
        if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
            throw "Checksummed payload is missing: $relativePath"
        }

        $actualHash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).
            Hash.ToLowerInvariant()

        if ($actualHash -ne $expectedHash) {
            throw "Internal checksum failed: $relativePath"
        }

        $authorizedEntries.Add($relativePath)
        $verifiedCount++
    }

    if (-not $authorizedEntries.Contains(
            'scripts/run-phase17-rehearsal.ps1'
        )) {
        throw 'The rehearsal runner is missing from the authorized payload.'
    }

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($ZipPath)
    try {
        $actualEntries = @(
            $archive.Entries |
                Where-Object { -not $_.FullName.EndsWith('/') } |
                ForEach-Object { $_.FullName.Replace('\', '/') } |
                Sort-Object
        )
    }
    finally {
        $archive.Dispose()
    }

    $expectedEntries = @(
        @('scripts/phase17_authorized_checksums.sha256') +
        $authorizedEntries |
            Sort-Object
    )

    $entryDifference = Compare-Object $expectedEntries $actualEntries
    if ($entryDifference) {
        throw 'ZIP entries differ from the authorized checksum inventory.'
    }

    @(
        "detached_zip_sha256=$actualZipHash"
        "zip_entry_count=$($actualEntries.Count)"
        "internal_checksums_verified=$verifiedCount"
        'unauthorized_entries=0'
    ) | Set-Content `
        -LiteralPath (Join-Path $EvidenceDirectory 'package-validation.txt') `
        -Encoding UTF8

    [PSCustomObject]@{
        PackageRoot = $Destination
        ZipHash = $actualZipHash
        EntryCount = $actualEntries.Count
        InternalChecksumCount = $verifiedCount
    }
}

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$zipPath = Join-Path $repositoryRoot 'phase17-execution-package.zip'
$detachedChecksumPath = Join-Path `
    $repositoryRoot `
    'phase17-execution-package.zip.sha256'

if (-not $EvidenceZipPath) {
    $EvidenceZipPath = Join-Path `
        $repositoryRoot `
        'phase17-rehearsal-evidence.zip'
}

$evidenceZipFullPath = [IO.Path]::GetFullPath($EvidenceZipPath)
$temporaryRoot = Join-Path `
    ([IO.Path]::GetTempPath()) `
    ('phase17-rehearsal-' + [guid]::NewGuid().ToString('N'))
$packageRoot = Join-Path $temporaryRoot 'package'
$evidenceDirectory = Join-Path $temporaryRoot 'evidence'
$summary = [ordered]@{
    server = $Server
    database = $DatabaseName
    package_verified = $false
    pre_validation = 'NOT_RUN'
    remediation_exit_code = $null
    post_verification_exit_code = $null
    integrity_audit_exit_code = $null
    user_role_diagnostic_exit_code = $null
    evidence_zip = $evidenceZipFullPath
    execution_result = 'PHASE17_REHEARSAL_FAILED'
    failure = $null
}
$exitCode = 1
$adminPassword = $null
$readOnlyPassword = $null

try {
    Assert-RehearsalServer -HostName $Server

    if (Test-Path -LiteralPath $evidenceZipFullPath) {
        throw "Evidence ZIP already exists: $evidenceZipFullPath"
    }

    if (-not (Test-Path -LiteralPath $zipPath -PathType Leaf)) {
        throw 'phase17-execution-package.zip is missing.'
    }

    if (-not (Test-Path -LiteralPath $detachedChecksumPath -PathType Leaf)) {
        throw 'phase17-execution-package.zip.sha256 is missing.'
    }

    New-Item -ItemType Directory -Path $packageRoot | Out-Null
    New-Item -ItemType Directory -Path $evidenceDirectory | Out-Null

    $psqlPath = Find-PsqlExecutable
    $package = Expand-AndVerifyPackage `
        -ZipPath $zipPath `
        -DetachedChecksumPath $detachedChecksumPath `
        -Destination $packageRoot `
        -EvidenceDirectory $evidenceDirectory
    $summary.package_verified = $true

    $checkpointReference = Read-Host `
        'Enter the verified rehearsal PITR checkpoint reference'
    if ($checkpointReference -notmatch '^[A-Za-z0-9._:/-]+$') {
        throw 'PITR checkpoint reference contains unsupported characters.'
    }

    $preValidationPath = Join-Path `
        $package.PackageRoot `
        'scripts\phase17_pre_remediation_validation.sql'
    $remediationPath = Join-Path `
        $package.PackageRoot `
        'scripts\phase17_production_schema_remediation.sql'
    $postVerificationPath = Join-Path `
        $package.PackageRoot `
        'scripts\phase17_post_remediation_verification.sql'
    $auditPath = Join-Path `
        $package.PackageRoot `
        'scripts\phase17_readonly_integrity_audit.sql'
    $diagnosticPath = Join-Path `
        $package.PackageRoot `
        'scripts\phase17_readonly_user_role_diagnostic.sql'

    $env:PGSSLMODE = 'require'
    $env:PGCONNECT_TIMEOUT = '20'

    $adminPassword = Read-Host `
        'Enter the rentipid_admin rehearsal password' `
        -AsSecureString

    $preValidation = Invoke-PsqlScript `
        -PsqlPath $psqlPath `
        -HostName $Server `
        -Database $DatabaseName `
        -UserName $AdminUser `
        -SecurePassword $adminPassword `
        -SqlFile $preValidationPath `
        -EvidenceDirectory $evidenceDirectory `
        -EvidenceName '01-pre-validation' `
        -Variables @{
            PHASE17_VALIDATED_HOST = $Server
        }

    $preLines = @(
        $preValidation.StdOut -split '\r?\n' |
            ForEach-Object { $_.Trim() } |
            Where-Object { $_ }
    )

    if ($preValidation.ExitCode -ne 0 -or
        $preLines -contains $BlockedMarker -or
        $preLines -notcontains $ReadyMarker) {
        $summary.pre_validation = 'PHASE17_PRE_REMEDIATION_BLOCKED'
        throw 'Pre-validation did not return PHASE17_PRE_REMEDIATION_READY.'
    }

    $summary.pre_validation = $ReadyMarker

    $remediation = Invoke-PsqlScript `
        -PsqlPath $psqlPath `
        -HostName $Server `
        -Database $DatabaseName `
        -UserName $AdminUser `
        -SecurePassword $adminPassword `
        -SqlFile $remediationPath `
        -EvidenceDirectory $evidenceDirectory `
        -EvidenceName '02-remediation' `
        -Variables @{
            PHASE17_VALIDATED_HOST = $Server
            PHASE17_OWNER_AUTHORIZATION =
                'PHASE17_CORRECTED_OWNER_AUTHORIZATION_APPROVED'
            PHASE17_PITR_CHECKPOINT = $checkpointReference
            PHASE17_MAINTENANCE_APPROVED = 'YES'
        }
    $summary.remediation_exit_code = $remediation.ExitCode
    if ($remediation.ExitCode -ne 0) {
        throw 'Authorized rehearsal remediation failed.'
    }

    $postVerification = Invoke-PsqlScript `
        -PsqlPath $psqlPath `
        -HostName $Server `
        -Database $DatabaseName `
        -UserName $AdminUser `
        -SecurePassword $adminPassword `
        -SqlFile $postVerificationPath `
        -EvidenceDirectory $evidenceDirectory `
        -EvidenceName '03-post-verification'
    $summary.post_verification_exit_code = $postVerification.ExitCode
    if ($postVerification.ExitCode -ne 0) {
        throw 'Post-remediation verification failed.'
    }

    $adminPassword.Dispose()
    $adminPassword = $null
    Clear-PgPassword

    $readOnlyPassword = Read-Host `
        'Enter the rentipid_phase17_readonly rehearsal password' `
        -AsSecureString

    $audit = Invoke-PsqlScript `
        -PsqlPath $psqlPath `
        -HostName $Server `
        -Database $DatabaseName `
        -UserName $ReadOnlyUser `
        -SecurePassword $readOnlyPassword `
        -SqlFile $auditPath `
        -EvidenceDirectory $evidenceDirectory `
        -EvidenceName '04-integrity-audit'
    $summary.integrity_audit_exit_code = $audit.ExitCode
    if ($audit.ExitCode -ne 0) {
        throw 'Final read-only integrity audit failed to execute.'
    }

    $diagnostic = Invoke-PsqlScript `
        -PsqlPath $psqlPath `
        -HostName $Server `
        -Database $DatabaseName `
        -UserName $ReadOnlyUser `
        -SecurePassword $readOnlyPassword `
        -SqlFile $diagnosticPath `
        -EvidenceDirectory $evidenceDirectory `
        -EvidenceName '05-user-role-diagnostic'
    $summary.user_role_diagnostic_exit_code = $diagnostic.ExitCode
    if ($diagnostic.ExitCode -ne 0) {
        throw 'Final user-role diagnostic failed to execute.'
    }

    $summary.execution_result = 'PHASE17_REHEARSAL_EXECUTION_COMPLETE'
    $exitCode = 0
}
catch {
    $summary.failure = $_.Exception.Message
}
finally {
    Clear-PgPassword
    Remove-Item Env:PGSSLMODE -ErrorAction SilentlyContinue
    Remove-Item Env:PGCONNECT_TIMEOUT -ErrorAction SilentlyContinue

    if ($null -ne $adminPassword) {
        $adminPassword.Dispose()
    }
    if ($null -ne $readOnlyPassword) {
        $readOnlyPassword.Dispose()
    }

    if (-not (Test-Path -LiteralPath $evidenceDirectory)) {
        New-Item -ItemType Directory -Path $evidenceDirectory -Force |
            Out-Null
    }

    $summary |
        ConvertTo-Json -Depth 4 |
        Set-Content `
            -LiteralPath (Join-Path $evidenceDirectory 'summary.json') `
            -Encoding UTF8

    if (-not (Test-Path -LiteralPath $evidenceZipFullPath)) {
        Compress-Archive `
            -Path (Join-Path $evidenceDirectory '*') `
            -DestinationPath $evidenceZipFullPath `
            -CompressionLevel Optimal
    }

    $temporaryFullPath = [IO.Path]::GetFullPath($temporaryRoot)
    $systemTempFullPath = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    if ($temporaryFullPath.StartsWith(
            $systemTempFullPath,
            [StringComparison]::OrdinalIgnoreCase
        ) -and
        (Split-Path $temporaryFullPath -Leaf).StartsWith(
            'phase17-rehearsal-',
            [StringComparison]::OrdinalIgnoreCase
        )) {
        Remove-Item -LiteralPath $temporaryFullPath -Recurse -Force
    }
}

@(
    'PHASE17_REHEARSAL_SUMMARY'
    "Server: $Server"
    "Database: $DatabaseName"
    "Package verified: $($summary.package_verified)"
    "Pre-validation: $($summary.pre_validation)"
    "Remediation exit code: $($summary.remediation_exit_code)"
    "Post-verification exit code: $($summary.post_verification_exit_code)"
    "Integrity audit exit code: $($summary.integrity_audit_exit_code)"
    "User-role diagnostic exit code: $($summary.user_role_diagnostic_exit_code)"
    "Evidence ZIP: $evidenceZipFullPath"
    "Execution result: $($summary.execution_result)"
) | Write-Output

exit $exitCode
