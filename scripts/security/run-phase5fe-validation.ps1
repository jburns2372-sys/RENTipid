$ErrorActionPreference = 'Stop'

function Get-RandomPassword {
    $bytes = New-Object Byte[] 16
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes) -replace '[^a-zA-Z0-9]', ''
}

try {
    $tempPass = Get-RandomPassword
    $env:PGPASSWORD = $tempPass

    docker run --name rentipid-phase5fe-db -e POSTGRES_PASSWORD=$tempPass -d -p 5434:5432 postgres:16
    Start-Sleep -Seconds 15

    docker exec rentipid-phase5fe-db psql -U postgres -c "CREATE DATABASE rentipid_test_soc;"

    $env:DATABASE_URL = "postgresql://postgres:$tempPass@127.0.0.1:5434/rentipid_test_soc"
    npx prisma db push --accept-data-loss --force-reset

    echo "--- Running Jest Tests ---"
    npx jest tests/security/crypto/phase5fe-key-rotation.test.ts tests/security/crypto/profile-field-protection.test.ts --runInBand

    echo "--- Running ESLint ---"
    npx eslint scripts/security/phase5f-e-key-rotation-drill.ts tests/security/crypto/phase5fe-key-rotation.test.ts src/lib/security/crypto/key-rotation.ts src/lib/security/crypto/key-provider.ts src/lib/security/crypto/profile-field-protection.ts src/app/api/auth/register/route.ts tests/security/crypto/profile-field-protection.test.ts

    echo "--- Running TypeScript Check ---"
    npx tsc --noEmit --pretty false

    echo "--- Running Rotation Drill ---"
    $env:NODE_OPTIONS = "--conditions=react-server"
    npx tsx scripts/security/phase5f-e-key-rotation-drill.ts
    Remove-Item Env:\NODE_OPTIONS

    $exitCode = $LASTEXITCODE
} finally {
    docker stop rentipid-phase5fe-db
    docker rm rentipid-phase5fe-db

    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:\MFA_ENCRYPTION_KEY -ErrorAction SilentlyContinue
    Remove-Item Env:\MFA_ENCRYPTION_KEY_ID -ErrorAction SilentlyContinue
    Remove-Item Env:\RETIRED_FIELD_ENCRYPTION_KEYS -ErrorAction SilentlyContinue
    Remove-Item Env:\NODE_OPTIONS -ErrorAction SilentlyContinue
}

if ($exitCode -ne 0) {
    exit $exitCode
}
