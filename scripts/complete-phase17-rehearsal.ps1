[CmdletBinding()]
param(
    [string]$Server = 'rentipid-p17-rehearsal-07290921.postgres.database.azure.com'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$PermittedServer = 'rentipid-p17-rehearsal-07290921.postgres.database.azure.com'
$RejectedProductionServer = 'rentipid-postgres-db.postgres.database.azure.com'
$DatabaseName = 'rentipid_db'
$AdminUser = 'rentipid_admin'
$BaselineMigration = '20260719144014_add_correlation_key_subject_fixed'
$SchemaReadyMarker = 'PHASE17_REHEARSAL_SCHEMA_READY_FOR_METADATA'
$FinalVerifiedMarker = 'PHASE17_SCHEMA_REMEDIATION_VERIFIED'
$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$PostVerificationScript = Join-Path `
    $RepositoryRoot `
    'scripts\phase17_post_remediation_verification.sql'

$AuthorizedPendingChain = @(
    '20260720061500_add_payment_action_log',
    '20260720073000_add_checkout_idempotency',
    '20260720231333_add_payment_action_log_security_event_source',
    '20260721155006_add_payment_action_log_amount_evidence',
    '20260721173423_add_payment_action_log_currency_evidence',
    '20260723053752_add_incident_case_foundation',
    '20260724131703_amend_incident_case_history_assignment',
    '20260724140000_soc_gate4g_playbooks',
    '20260724145953_reconcile_incident_case_reopen_lifecycle',
    '20260724155000_soc_gate4g_playbook_concurrency',
    '20260725000000_add_approved_scope_binding',
    '20260725145200_gate4h_reversible_response_execution',
    '20260725185900_add_mfa_schema',
    '20260726162419_add_behavioral_risk_persistence',
    '20260727011311_phase5f_profile_encryption_companion_fields'
)

function Assert-RehearsalServer {
    param([Parameter(Mandatory)][string]$HostName)

    if ($HostName.IndexOf(
            $RejectedProductionServer,
            [StringComparison]::OrdinalIgnoreCase
        ) -ge 0) {
        throw 'Production hostname is explicitly prohibited.'
    }

    if (-not $HostName.Equals(
            $PermittedServer,
            [StringComparison]::OrdinalIgnoreCase
        )) {
        throw 'Only the hard-coded PHASE17 rehearsal hostname is permitted.'
    }
}

function Find-Executable {
    param(
        [Parameter(Mandatory)][string[]]$Names,
        [string[]]$FallbackPaths = @()
    )

    foreach ($name in $Names) {
        $command = Get-Command $name -ErrorAction SilentlyContinue
        if ($null -ne $command) {
            return $command.Source
        }
    }

    foreach ($path in $FallbackPaths) {
        if ($path -and (Test-Path -LiteralPath $path -PathType Leaf)) {
            return (Resolve-Path -LiteralPath $path).Path
        }
    }

    throw "Required executable was not found: $($Names -join ', ')"
}

function Set-RehearsalCredentials {
    param([Parameter(Mandatory)][Security.SecureString]$SecurePassword)

    $bstr = [IntPtr]::Zero
    try {
        $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR(
            $SecurePassword
        )
        $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR(
            $bstr
        )
        $encodedUser = [Uri]::EscapeDataString($AdminUser)
        $encodedPassword = [Uri]::EscapeDataString($plainPassword)

        $env:PGPASSWORD = $plainPassword
        $env:DATABASE_URL = (
            "postgresql://${encodedUser}:${encodedPassword}" +
            "@${Server}:5432/${DatabaseName}" +
            '?sslmode=require&connect_timeout=20'
        )
    }
    finally {
        $plainPassword = $null
        $encodedPassword = $null
        if ($bstr -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
        }
    }
}

function Clear-RehearsalCredentials {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
}

function Invoke-CapturedProcess {
    param(
        [Parameter(Mandatory)][string]$Executable,
        [Parameter(Mandatory)][string[]]$Arguments,
        [Parameter(Mandatory)][string]$WorkingDirectory,
        [Parameter(Mandatory)][string]$CaptureDirectory,
        [Parameter(Mandatory)][string]$CaptureName
    )

    $stdoutPath = Join-Path $CaptureDirectory "$CaptureName.stdout.txt"
    $stderrPath = Join-Path $CaptureDirectory "$CaptureName.stderr.txt"

    $process = Start-Process `
        -FilePath $Executable `
        -ArgumentList $Arguments `
        -WorkingDirectory $WorkingDirectory `
        -NoNewWindow `
        -Wait `
        -PassThru `
        -RedirectStandardOutput $stdoutPath `
        -RedirectStandardError $stderrPath

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

    if ($stdout) {
        Write-Host $stdout.TrimEnd()
    }
    if ($stderr) {
        Write-Host $stderr.TrimEnd()
    }

    [PSCustomObject]@{
        ExitCode = $process.ExitCode
        StdOut = $stdout
        StdErr = $stderr
        StdOutPath = $stdoutPath
        StdErrPath = $stderrPath
    }
}

function Invoke-PsqlFile {
    param(
        [Parameter(Mandatory)][string]$PsqlPath,
        [Parameter(Mandatory)][string]$SqlFile,
        [Parameter(Mandatory)][string]$CaptureDirectory,
        [Parameter(Mandatory)][string]$CaptureName
    )

    Invoke-CapturedProcess `
        -Executable $PsqlPath `
        -Arguments @(
            '--no-psqlrc',
            '--no-password',
            "--host=$Server",
            '--port=5432',
            "--dbname=$DatabaseName",
            "--username=$AdminUser",
            '--set=ON_ERROR_STOP=1',
            "--file=`"$SqlFile`""
        ) `
        -WorkingDirectory $RepositoryRoot `
        -CaptureDirectory $CaptureDirectory `
        -CaptureName $CaptureName
}

function Get-OutputLines {
    param([string]$Text)

    @(
        $Text -split '\r?\n' |
            ForEach-Object { $_.Trim() } |
            Where-Object { $_ }
    )
}

Assert-RehearsalServer -HostName $Server

$MigrationRoot = Join-Path $RepositoryRoot 'prisma\migrations'
$MigrationNames = @(
    Get-ChildItem -LiteralPath $MigrationRoot -Directory |
        Sort-Object Name |
        ForEach-Object { $_.Name }
)
$BaselineIndex = [Array]::IndexOf($MigrationNames, $BaselineMigration)

if ($BaselineIndex -lt 0) {
    throw "Baseline migration directory is missing: $BaselineMigration"
}

$DerivedPendingChain = @(
    $MigrationNames[($BaselineIndex + 1)..($MigrationNames.Count - 1)]
)

if ($DerivedPendingChain.Count -ne 15) {
    throw "Expected exactly 15 pending migration directories; found $($DerivedPendingChain.Count)."
}

$ChainDifference = Compare-Object `
    -ReferenceObject $AuthorizedPendingChain `
    -DifferenceObject $DerivedPendingChain `
    -SyncWindow 0

if ($ChainDifference) {
    throw 'Derived migration chain differs from the authorized PHASE17 chain.'
}

foreach ($migrationName in $DerivedPendingChain) {
    $migrationSql = Join-Path `
        $MigrationRoot `
        "$migrationName\migration.sql"
    if (-not (Test-Path -LiteralPath $migrationSql -PathType Leaf)) {
        throw "Migration SQL is missing: $migrationSql"
    }
}

$PsqlFallbacks = [Collections.Generic.List[string]]::new()
foreach ($programRoot in @(
        $env:ProgramFiles,
        ${env:ProgramFiles(x86)}
    )) {
    if (-not $programRoot) {
        continue
    }
    $postgresRoot = Join-Path $programRoot 'PostgreSQL'
    if (-not (Test-Path -LiteralPath $postgresRoot -PathType Container)) {
        continue
    }
    Get-ChildItem -LiteralPath $postgresRoot -Directory |
        Sort-Object Name -Descending |
        ForEach-Object {
            $PsqlFallbacks.Add((Join-Path $_.FullName 'bin\psql.exe'))
        }
}

$PsqlPath = Find-Executable `
    -Names @('psql.exe', 'psql') `
    -FallbackPaths $PsqlFallbacks.ToArray()
$NpxPath = Find-Executable `
    -Names @('npx.cmd', 'npx.exe', 'npx') `
    -FallbackPaths @(
        (Join-Path $RepositoryRoot 'node_modules\.bin\npx.cmd')
    )

if (-not (Test-Path -LiteralPath $PostVerificationScript -PathType Leaf)) {
    throw "Post-verification script is missing: $PostVerificationScript"
}

$TemporaryRoot = Join-Path `
    $env:TEMP `
    ('phase17-metadata-reconciliation-' + [guid]::NewGuid().ToString('N'))
$SchemaVerificationSql = Join-Path `
    $TemporaryRoot `
    'phase17-schema-only-verification.sql'
$FinalMarkerSql = Join-Path `
    $TemporaryRoot `
    'phase17-final-metadata-marker.sql'
$SecurePassword = $null
$CurrentOperation = $SchemaVerificationSql

try {
    New-Item -ItemType Directory -Path $TemporaryRoot | Out-Null

    @'
\set ON_ERROR_STOP on
\set QUIET 1
\pset pager off
\pset tuples_only on
\pset format unaligned

BEGIN TRANSACTION READ ONLY;

DO $phase17_schema_only$
DECLARE
  expected_tables text[] := ARRAY[
    'PaymentActionLog',
    'IncidentCase',
    'IncidentCaseHistory',
    'IncidentCaseNote',
    'IncidentCaseEvidence',
    'SecurityResponsePlaybook',
    'SecurityResponseStep',
    'IncidentCasePlaybookLink',
    'SecurityResponseApprovalRequest',
    'SecurityResponseApprovalDecision',
    'SecurityResponseApprovalGrant',
    'SecurityResponseExecution',
    'SecurityResponseAction',
    'UserMfa',
    'BehavioralRiskAssessment',
    'BehavioralRiskSignal',
    'BehavioralRiskEvidenceLink',
    'SecurityEventGeoEnrichment'
  ];
  missing_objects text[];
  invalid_objects text[];
  migration_count integer;
  completed_migration_count integer;
  unfinished_migration_count integer;
  expected_constraint record;
  expected_column record;
BEGIN
  IF current_database() <> 'rentipid_db' THEN
    RAISE EXCEPTION
      'PHASE17_SCHEMA_ONLY_STOP: wrong database: %',
      current_database();
  END IF;

  IF current_user <> 'rentipid_admin' THEN
    RAISE EXCEPTION
      'PHASE17_SCHEMA_ONLY_STOP: wrong database user: %',
      current_user;
  END IF;

  SELECT array_agg(table_name ORDER BY table_name)
  INTO missing_objects
  FROM unnest(expected_tables) AS expected(table_name)
  WHERE to_regclass(format('public.%I', table_name)) IS NULL;

  IF missing_objects IS NOT NULL THEN
    RAISE EXCEPTION
      'PHASE17_SCHEMA_ONLY_STOP: missing authorized tables: %',
      array_to_string(missing_objects, ', ');
  END IF;

  SELECT array_agg(table_name ORDER BY table_name)
  INTO missing_objects
  FROM unnest(expected_tables) AS expected(table_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_index idx ON idx.indexrelid = con.conindid
    WHERE con.conrelid =
      to_regclass(format('public.%I', expected.table_name))
      AND con.contype = 'p'
      AND con.convalidated
      AND idx.indisvalid
      AND idx.indisready
  );

  IF missing_objects IS NOT NULL THEN
    RAISE EXCEPTION
      'PHASE17_SCHEMA_ONLY_STOP: required primary indexes are missing or invalid for tables: %',
      array_to_string(missing_objects, ', ');
  END IF;

  SELECT array_agg(
    format('%I.%I', table_relation.relname, index_relation.relname)
    ORDER BY table_relation.relname, index_relation.relname
  )
  INTO invalid_objects
  FROM pg_index idx
  JOIN pg_class index_relation ON index_relation.oid = idx.indexrelid
  JOIN pg_class table_relation ON table_relation.oid = idx.indrelid
  JOIN pg_namespace namespace ON namespace.oid = table_relation.relnamespace
  WHERE namespace.nspname = 'public'
    AND table_relation.relname = ANY(expected_tables)
    AND (NOT idx.indisvalid OR NOT idx.indisready);

  IF invalid_objects IS NOT NULL THEN
    RAISE EXCEPTION
      'PHASE17_SCHEMA_ONLY_STOP: invalid required indexes: %',
      array_to_string(invalid_objects, ', ');
  END IF;

  SELECT array_agg(
    format('%I.%I', relation.relname, con.conname)
    ORDER BY relation.relname, con.conname
  )
  INTO invalid_objects
  FROM pg_constraint con
  JOIN pg_class relation ON relation.oid = con.conrelid
  JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
  WHERE namespace.nspname = 'public'
    AND relation.relname = ANY(expected_tables)
    AND NOT con.convalidated;

  IF invalid_objects IS NOT NULL THEN
    RAISE EXCEPTION
      'PHASE17_SCHEMA_ONLY_STOP: unvalidated constraints: %',
      array_to_string(invalid_objects, ', ');
  END IF;

  FOR expected_constraint IN
    SELECT *
    FROM (
      VALUES
        (
          'IncidentCaseHistory',
          'chk_incidentcasehistory_status_change'
        ),
        ('IncidentCase', 'chk_incidentcase_reopened_at_req'),
        ('IncidentCase', 'chk_incidentcase_reopened_at')
    ) AS required(table_name, constraint_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint con
      WHERE con.conrelid = to_regclass(
        format('public.%I', expected_constraint.table_name)
      )
        AND con.conname = expected_constraint.constraint_name
        AND con.convalidated
    ) THEN
      RAISE EXCEPTION
        'PHASE17_SCHEMA_ONLY_STOP: authorized replacement constraint missing or unvalidated: %.%',
        expected_constraint.table_name,
        expected_constraint.constraint_name;
    END IF;
  END LOOP;

  IF to_regprocedure('public.prevent_incident_case_mutation()') IS NULL THEN
    RAISE EXCEPTION
      'PHASE17_SCHEMA_ONLY_STOP: required object missing: public.prevent_incident_case_mutation()';
  END IF;

  IF to_regprocedure(
    'public.require_incident_case_assignment_target()'
  ) IS NULL THEN
    RAISE EXCEPTION
      'PHASE17_SCHEMA_ONLY_STOP: required object missing: public.require_incident_case_assignment_target()';
  END IF;

  FOR expected_column IN
    SELECT *
    FROM (
      VALUES
        ('UserProfile', 'address_encrypted'),
        ('BusinessProfile', 'business_address_encrypted'),
        (
          'BusinessProfile',
          'business_registration_number_encrypted'
        )
    ) AS required(table_name, column_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns actual
      WHERE actual.table_schema = 'public'
        AND actual.table_name = expected_column.table_name
        AND actual.column_name = expected_column.column_name
    ) THEN
      RAISE EXCEPTION
        'PHASE17_SCHEMA_ONLY_STOP: required column missing: %.%',
        expected_column.table_name,
        expected_column.column_name;
    END IF;
  END LOOP;

  SELECT
    count(*)::integer,
    count(*) FILTER (
      WHERE finished_at IS NOT NULL
        AND rolled_back_at IS NULL
    )::integer,
    count(*) FILTER (
      WHERE finished_at IS NULL
        OR rolled_back_at IS NOT NULL
    )::integer
  INTO
    migration_count,
    completed_migration_count,
    unfinished_migration_count
  FROM "_prisma_migrations";

  IF migration_count <> 13 THEN
    RAISE EXCEPTION
      'PHASE17_SCHEMA_ONLY_STOP: expected 13 migration records before reconciliation, found %',
      migration_count;
  END IF;

  IF completed_migration_count <> 13 THEN
    RAISE EXCEPTION
      'PHASE17_SCHEMA_ONLY_STOP: expected 13 completed migration records before reconciliation, found %',
      completed_migration_count;
  END IF;

  IF unfinished_migration_count <> 0 THEN
    RAISE EXCEPTION
      'PHASE17_SCHEMA_ONLY_STOP: expected 0 unfinished or rolled-back migration records before reconciliation, found %',
      unfinished_migration_count;
  END IF;
END
$phase17_schema_only$;

SELECT 'PHASE17_REHEARSAL_SCHEMA_READY_FOR_METADATA'
  AS phase17_schema_verification_result
\gset

ROLLBACK;
\unset QUIET
\echo :phase17_schema_verification_result
'@ | Set-Content `
        -LiteralPath $SchemaVerificationSql `
        -Encoding UTF8

    @'
\set ON_ERROR_STOP on
\set QUIET 1
\pset pager off
\pset tuples_only on
\pset format unaligned

BEGIN TRANSACTION READ ONLY;

SELECT
  CASE
    WHEN count(*) = 28
     AND count(*) FILTER (
       WHERE finished_at IS NOT NULL
         AND rolled_back_at IS NULL
     ) = 28
     AND count(*) FILTER (
       WHERE finished_at IS NULL
         AND rolled_back_at IS NULL
     ) = 0
      THEN 'PHASE17_SCHEMA_REMEDIATION_VERIFIED'
    ELSE 'PHASE17_SCHEMA_REMEDIATION_BLOCKED'
  END AS phase17_final_verification_result
FROM "_prisma_migrations"
\gset

ROLLBACK;
\unset QUIET
\echo :phase17_final_verification_result
'@ | Set-Content `
        -LiteralPath $FinalMarkerSql `
        -Encoding UTF8

    $SecurePassword = Read-Host `
        'Enter the rentipid_admin rehearsal password' `
        -AsSecureString
    Set-RehearsalCredentials -SecurePassword $SecurePassword

    $CurrentOperation = $SchemaVerificationSql
    $SchemaVerification = Invoke-PsqlFile `
        -PsqlPath $PsqlPath `
        -SqlFile $SchemaVerificationSql `
        -CaptureDirectory $TemporaryRoot `
        -CaptureName '01-schema-verification'

    $SchemaLines = Get-OutputLines -Text $SchemaVerification.StdOut
    if ($SchemaVerification.ExitCode -ne 0 -or
        $SchemaLines -notcontains $SchemaReadyMarker) {
        $SchemaFailure = $SchemaVerification.StdErr.Trim()
        if (-not $SchemaFailure) {
            $SchemaFailure = (
                "required marker was not returned: $SchemaReadyMarker"
            )
        }
        throw (
            'Schema-only verification failed; migration metadata was not ' +
            "changed. Exact failure: $SchemaFailure"
        )
    }

    for ($index = 0; $index -lt $DerivedPendingChain.Count; $index++) {
        $migrationName = $DerivedPendingChain[$index]
        $CurrentOperation = "npx prisma migrate resolve --applied $migrationName"
        Write-Host (
            'Resolving migration metadata {0:D2}/15: {1}' -f
            ($index + 1),
            $migrationName
        )

        $ResolveResult = Invoke-CapturedProcess `
            -Executable $NpxPath `
            -Arguments @(
                '--no-install',
                'prisma',
                'migrate',
                'resolve',
                '--applied',
                $migrationName,
                '--schema',
                'prisma/schema.prisma'
            ) `
            -WorkingDirectory $RepositoryRoot `
            -CaptureDirectory $TemporaryRoot `
            -CaptureName ('02-resolve-{0:D2}' -f ($index + 1))

        if ($ResolveResult.ExitCode -ne 0) {
            throw (
                "Prisma migrate resolve failed for $migrationName. " +
                "Exit code: $($ResolveResult.ExitCode)"
            )
        }
    }

    $CurrentOperation = $PostVerificationScript
    $PostVerification = Invoke-PsqlFile `
        -PsqlPath $PsqlPath `
        -SqlFile $PostVerificationScript `
        -CaptureDirectory $TemporaryRoot `
        -CaptureName '03-post-verification'

    if ($PostVerification.ExitCode -ne 0) {
        throw (
            'PHASE17 post-remediation verification failed. ' +
            "Exit code: $($PostVerification.ExitCode)"
        )
    }

    $CurrentOperation = $FinalMarkerSql
    $FinalVerification = Invoke-PsqlFile `
        -PsqlPath $PsqlPath `
        -SqlFile $FinalMarkerSql `
        -CaptureDirectory $TemporaryRoot `
        -CaptureName '04-final-marker'

    $FinalLines = Get-OutputLines -Text $FinalVerification.StdOut
    if ($FinalVerification.ExitCode -ne 0 -or
        $FinalLines -notcontains $FinalVerifiedMarker) {
        throw 'Final PHASE17 migration-metadata verification failed.'
    }

    Write-Host $FinalVerifiedMarker
}
catch {
    Write-Host "Exception: $($_.Exception.Message)"
    Write-Host "Failing command or path: $CurrentOperation"
    throw
}
finally {
    Clear-RehearsalCredentials
    if ($null -ne $SecurePassword) {
        $SecurePassword.Dispose()
    }

    $TemporaryFullPath = [IO.Path]::GetFullPath($TemporaryRoot)
    $SystemTempFullPath = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    if ($TemporaryFullPath.StartsWith(
            $SystemTempFullPath,
            [StringComparison]::OrdinalIgnoreCase
        ) -and
        (Split-Path $TemporaryFullPath -Leaf).StartsWith(
            'phase17-metadata-reconciliation-',
            [StringComparison]::OrdinalIgnoreCase
        ) -and
        (Test-Path -LiteralPath $TemporaryFullPath)) {
        Remove-Item -LiteralPath $TemporaryFullPath -Recurse -Force
    }
}
