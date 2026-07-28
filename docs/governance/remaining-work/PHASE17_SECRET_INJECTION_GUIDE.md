# PHASE 17 Secret Injection Guide

## Secure Environment Variable Injection

The authorized DBA must securely inject the read-only credentials into the execution environment without exposing them. The dedicated environment variable is:

`PHASE17_READONLY_DATABASE_URL`

This variable is audit-only. It must target the DBA-confirmed logical database on Azure PostgreSQL server resource `rentipid-postgres-db`; it must not replace, reuse, reveal, or overwrite the application's `DATABASE_URL`. Use `kv-rentipid-prod` or approved local secure injection. Key Vault references, local injection, and presence checks must never print the value.

### Prohibited Storage
The secret value must **NOT** be placed in:
- Chat interfaces
- Source code or `.env.example`
- Documentation or screenshots
- Git repositories
- Command outputs
- Temporary unencrypted scripts

### Secure Setup Instructions (Windows PowerShell)

Use the following secure prompt method to set the variable for the current terminal session without printing it to the console:

```powershell
$secureValue = Read-Host "Enter PHASE17 read-only database URL" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
try {
    $env:PHASE17_READONLY_DATABASE_URL = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    Remove-Variable secureValue, ptr -ErrorAction SilentlyContinue
}
```

### Verification
The only permitted presence check is to verify existence without printing the value:

```powershell
if ($env:PHASE17_READONLY_DATABASE_URL) {
    "PHASE17_READONLY_DATABASE_URL: PRESENT"
} else {
    "PHASE17_READONLY_DATABASE_URL: MISSING"
}
```
