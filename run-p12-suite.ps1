$srcDir = "src/lib/ai"

function Get-DirHash {
    $hash = ""
    Get-ChildItem -Path $srcDir -Recurse -File | Sort-Object FullName | ForEach-Object {
        $fileHash = (Get-FileHash $_.FullName -Algorithm SHA256).Hash
        $hash += "$($_.FullName):$fileHash`n"
    }
    return (Get-HashFromString $hash)
}

function Get-HashFromString($string) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($string)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $hashBytes = $sha256.ComputeHash($bytes)
    return [System.BitConverter]::ToString($hashBytes) -replace '-'
}

$preHash = Get-DirHash
Out-File -FilePath "docs/unified-ai-customer-service/PRE_VALIDATION_SHA256.txt" -InputObject $preHash -Encoding UTF8

Write-Host "--- Running Final Release Suite ---"
$tests = @(
    "p3_test.ts",
    "p4_test.ts",
    "p5_test.ts",
    "p6_test.ts",
    "p7_test.ts",
    "p8_test.ts",
    "p9_test.ts",
    "p10_test.ts",
    "p11_test.ts"
)

$exitCode = 0
foreach ($test in $tests) {
    if (Test-Path $test) {
        Write-Host "Running $test..."
        npx tsx $test
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Test $test FAILED!"
            $exitCode = 1
        }
    }
}

$postHash = Get-DirHash
Out-File -FilePath "docs/unified-ai-customer-service/POST_VALIDATION_SHA256.txt" -InputObject $postHash -Encoding UTF8

if ($preHash -eq $postHash) {
    Write-Host "0 unexpected validated-file hash mismatches"
} else {
    Write-Host "Unexpected hash mismatch!"
}

Write-Host "Writing VALIDATED_FILE_SET.txt"
Get-ChildItem -Path $srcDir -Recurse -File | Sort-Object FullName | Select-Object -ExpandProperty FullName | Out-File -FilePath "docs/unified-ai-customer-service/VALIDATED_FILE_SET.txt" -Encoding UTF8

exit $exitCode
