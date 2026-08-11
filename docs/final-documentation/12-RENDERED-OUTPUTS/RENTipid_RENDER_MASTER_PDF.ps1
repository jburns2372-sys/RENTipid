$ErrorActionPreference = 'Stop'

$documentationRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$markdownPath = Join-Path $documentationRoot '01-MASTER-MANUAL/RENTipid_COMPLETE_MASTER_MANUAL.md'
$htmlPath = Join-Path $PSScriptRoot 'RENTipid_COMPLETE_MASTER_MANUAL.html'
$pdfPath = Join-Path $PSScriptRoot 'RENTipid_COMPLETE_MASTER_MANUAL.pdf'
$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$renderProfile = Join-Path $PSScriptRoot '.chrome-render-profile'

if (-not (Test-Path -LiteralPath $chromePath)) {
    throw 'Chrome executable not found.'
}

if (Test-Path -LiteralPath $pdfPath) {
    throw "PDF target already exists: $pdfPath"
}

if (Test-Path -LiteralPath $renderProfile) {
    $resolvedProfile = (Resolve-Path -LiteralPath $renderProfile).Path
    if (-not $resolvedProfile.StartsWith($PSScriptRoot, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Unexpected render-profile path.'
    }
    Remove-Item -LiteralPath $resolvedProfile -Recurse -Force
}

New-Item -ItemType Directory -Path $renderProfile | Out-Null

function Convert-InlineMarkdown([string] $Text) {
    $value = [Net.WebUtility]::HtmlEncode($Text)
    $value = [regex]::Replace($value, '`([^`]+)`', '<code>$1</code>')
    $value = [regex]::Replace($value, '\*\*([^*]+)\*\*', '<strong>$1</strong>')
    $value = [regex]::Replace($value, '\[([^\]]+)\]\(([^)]+)\)', '<a href="$2">$1</a>')
    return $value
}

function Convert-ToSlug([string] $Text) {
    $value = $Text.ToLowerInvariant()
    $value = [regex]::Replace($value, '[^a-z0-9]+', '-')
    return $value.Trim('-')
}

$lines = Get-Content -LiteralPath $markdownPath -Encoding utf8
$toc = New-Object Text.StringBuilder
$body = New-Object Text.StringBuilder
$paragraph = New-Object Collections.Generic.List[string]
$code = New-Object Text.StringBuilder
$inCode = $false
$inTable = $false
$listType = ''

function Close-Paragraph {
    if ($paragraph.Count -gt 0) {
        $text = Convert-InlineMarkdown (($paragraph -join ' ').Trim())
        [void] $body.AppendLine('<p>' + $text + '</p>')
        $paragraph.Clear()
    }
}

function Close-List {
    if ($script:listType) {
        [void] $body.AppendLine(('</{0}>' -f $script:listType))
        $script:listType = ''
    }
}

function Close-Table {
    if ($script:inTable) {
        [void] $body.AppendLine('</tbody></table>')
        $script:inTable = $false
    }
}

foreach ($line in $lines) {
    if ($line -match '^```') {
        Close-Paragraph
        Close-List
        Close-Table
        if (-not $inCode) {
            $inCode = $true
            $code.Clear()
        }
        else {
            $encodedCode = [Net.WebUtility]::HtmlEncode($code.ToString().TrimEnd())
            [void] $body.AppendLine('<pre><code>' + $encodedCode + '</code></pre>')
            $inCode = $false
        }
        continue
    }

    if ($inCode) {
        [void] $code.AppendLine($line)
        continue
    }

    if ($line -match '^(#{1,3})\s+(.+)$') {
        Close-Paragraph
        Close-List
        Close-Table
        $level = $Matches[1].Length
        $title = $Matches[2]
        $id = Convert-ToSlug $title
        $headingClass = if ($title -match '^Part ') { ' class="part"' } else { '' }
        $heading = '<h{0} id="{1}"{2}>{3}</h{0}>' -f $level, $id, $headingClass, (Convert-InlineMarkdown $title)
        [void] $body.AppendLine($heading)
        if ($level -ge 2) {
            $tocClass = 'toc-l{0}' -f $level
            $indent = if ($level -eq 3) { '&nbsp;&nbsp;&nbsp;' } else { '' }
            $tocLine = '<div class="{0}">{1}<a href="#{2}">{3}</a></div>' -f $tocClass, $indent, $id, (Convert-InlineMarkdown $title)
            [void] $toc.AppendLine($tocLine)
        }
        continue
    }

    if ($line -match '^\|.*\|\s*$') {
        Close-Paragraph
        Close-List
        $cells = @($line.Trim('|').Split('|') | ForEach-Object { $_.Trim() })
        if (($cells | Where-Object { $_ -notmatch '^:?-{3,}:?$' }).Count -eq 0) {
            continue
        }
        if (-not $inTable) {
            $inTable = $true
            [void] $body.AppendLine('<table><tbody>')
        }
        [void] $body.Append('<tr>')
        foreach ($cell in $cells) {
            [void] $body.Append('<td>' + (Convert-InlineMarkdown $cell) + '</td>')
        }
        [void] $body.AppendLine('</tr>')
        continue
    }
    else {
        Close-Table
    }

    if ($line -match '^>\s?(.*)$') {
        Close-Paragraph
        Close-List
        [void] $body.AppendLine('<blockquote>' + (Convert-InlineMarkdown $Matches[1]) + '</blockquote>')
        continue
    }

    if ($line -match '^[-*]\s+(.+)$') {
        Close-Paragraph
        if ($listType -ne 'ul') {
            Close-List
            $listType = 'ul'
            [void] $body.AppendLine('<ul>')
        }
        [void] $body.AppendLine('<li>' + (Convert-InlineMarkdown $Matches[1]) + '</li>')
        continue
    }

    if ($line -match '^\d+\.\s+(.+)$') {
        Close-Paragraph
        if ($listType -ne 'ol') {
            Close-List
            $listType = 'ol'
            [void] $body.AppendLine('<ol>')
        }
        [void] $body.AppendLine('<li>' + (Convert-InlineMarkdown $Matches[1]) + '</li>')
        continue
    }

    if ([string]::IsNullOrWhiteSpace($line)) {
        Close-Paragraph
        Close-List
        Close-Table
        continue
    }

    $paragraph.Add($line.Trim())
}

Close-Paragraph
Close-List
Close-Table

$figureTitles = @(
    'System context', 'User and role ecosystem',
    'Vercel/Azure architecture direction', 'Repository/runtime transition state',
    'Renter journey', 'Provider journey', 'Listing lifecycle', 'Booking lifecycle',
    'Agreement lifecycle', 'Payment, webhook and reconciliation',
    'Deposit, refund and payout', 'Inspection, damage claim and dispute',
    'KYC and business verification', 'SOC event-to-response architecture',
    'Detection and alert flow', 'Incident, approval, execution and rollback',
    'Emergency freeze', 'AI and digital-human architecture', 'AI tool gateway',
    'AI support-case lifecycle', 'Database domain map', 'API and integration map',
    'PWA and Capacitor architecture', 'Monitoring, backup and recovery',
    'Phase completion and freeze timeline'
)

$figures = New-Object Text.StringBuilder
[void] $figures.AppendLine('<section class="figures"><h2>Figure Catalog</h2>')
for ($index = 0; $index -lt $figureTitles.Count; $index++) {
    $caption = [Net.WebUtility]::HtmlEncode($figureTitles[$index])
    [void] $figures.AppendLine(('<figure><figcaption>Figure {0} &mdash; {1}. Mermaid source retained; raster rendering unavailable.</figcaption></figure>' -f ($index + 1), $caption))
}
[void] $figures.AppendLine('</section>')

$css = @'
@page { size: A4; margin: 20mm 16mm 20mm 16mm; }
body { font-family: "Segoe UI", Arial, sans-serif; color: #172033; font-size: 10pt; line-height: 1.45; margin: 0; }
header { position: fixed; top: -14mm; left: 0; right: 0; border-bottom: 1px solid #2f5f8f; color: #2f5f8f; font-size: 8pt; padding-bottom: 3px; }
footer { position: fixed; bottom: -14mm; left: 0; right: 0; border-top: 1px solid #999; font-size: 8pt; color: #555; padding-top: 3px; text-align: center; }
footer .page:after { content: counter(page); }
.cover { height: 245mm; display: flex; flex-direction: column; justify-content: center; text-align: center; page-break-after: always; }
.cover h1 { font-size: 30pt; color: #173f6b; }
.confidential { color: #8b1e1e; font-weight: 700; letter-spacing: .08em; }
.toc { page-break-after: always; }
.toc-l2 { font-weight: 600; margin-top: 5px; }
.toc-l3 { font-size: 8.5pt; }
h1 { color: #173f6b; }
h2 { color: #1f527d; border-bottom: 1px solid #9bb4c9; padding-bottom: 3px; margin-top: 22px; }
h2.part { page-break-before: always; }
h3 { color: #2f5f8f; margin-top: 16px; page-break-after: avoid; }
p, li { orphans: 3; widows: 3; }
table { border-collapse: collapse; width: 100%; font-size: 8.5pt; margin: 10px 0; page-break-inside: avoid; }
td { border: 1px solid #9aa7b4; padding: 4px; vertical-align: top; }
tr:first-child td { font-weight: 700; background: #e8f0f7; }
code { font-family: Consolas, monospace; background: #eef2f5; padding: 1px 3px; word-break: break-word; }
pre { white-space: pre-wrap; background: #eef2f5; border: 1px solid #ccd5dd; padding: 8px; }
blockquote { border-left: 4px solid #2f5f8f; background: #eef5fb; margin: 10px 0; padding: 7px 10px; }
figure { margin: 8px 0; }
figcaption { font-style: italic; color: #445; }
a { color: #174f82; text-decoration: none; }
'@

$html = @"
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>RENTipid Complete Master Manual</title>
<style>$css</style>
</head>
<body>
<header>RENTipid Complete Application Documentation &mdash; Internal</header>
<footer>RENTipid Internal &middot; Page <span class="page"></span></footer>
<section class="cover">
<div class="confidential">RENTIPID INTERNAL</div>
<h1>RENTipid Complete Master Manual</h1>
<p>Version 1.1 &middot; Editorial rendering closure</p>
<p>Branch: feature/soc-phase4-threat-response</p>
<p>HEAD: 5804d4cceafc74e5e51b554be6f84a1b9c80e8be</p>
<p>Generated 2026-07-31 &middot; Asia/Shanghai</p>
</section>
<section class="toc"><h1>Table of Contents</h1>$($toc.ToString())</section>
$($body.ToString())
$($figures.ToString())
</body>
</html>
"@

[IO.File]::WriteAllText($htmlPath, $html, (New-Object Text.UTF8Encoding($false)))
$htmlUri = ([Uri] $htmlPath).AbsoluteUri

try {
    & $chromePath '--headless=new' '--disable-gpu' '--no-sandbox' '--disable-extensions' '--disable-background-networking' "--user-data-dir=$renderProfile" '--no-pdf-header-footer' "--print-to-pdf=$pdfPath" $htmlUri
    $renderExitCode = $LASTEXITCODE
    if ($null -eq $renderExitCode -and -not (Test-Path -LiteralPath $pdfPath)) {
        # Windows PowerShell may return from a GUI executable before its
        # headless output is flushed. Wait only for the requested local file.
        for ($attempt = 1; $attempt -le 50 -and -not (Test-Path -LiteralPath $pdfPath); $attempt++) {
            Start-Sleep -Milliseconds 200
        }
    }
    if ($null -eq $renderExitCode -and (Test-Path -LiteralPath $pdfPath)) {
        # Windows GUI executables may not populate LASTEXITCODE even when the
        # requested headless output is created. Signature validation below is
        # the final success authority.
        $renderExitCode = 0
    }
}
finally {
    if (Test-Path -LiteralPath $renderProfile) {
        $resolvedProfile = (Resolve-Path -LiteralPath $renderProfile).Path
        if ($resolvedProfile.StartsWith($PSScriptRoot, [StringComparison]::OrdinalIgnoreCase)) {
            for ($attempt = 1; $attempt -le 5 -and (Test-Path -LiteralPath $resolvedProfile); $attempt++) {
                Remove-Item -LiteralPath $resolvedProfile -Recurse -Force -ErrorAction SilentlyContinue
                if (Test-Path -LiteralPath $resolvedProfile) {
                    Start-Sleep -Milliseconds 200
                }
            }
        }
    }
}

if ($renderExitCode -ne 0) {
    throw "Chrome PDF rendering failed with exit code $renderExitCode."
}

if (-not (Test-Path -LiteralPath $pdfPath)) {
    throw 'Chrome reported success but did not create the PDF.'
}

$pdfBytes = [IO.File]::ReadAllBytes($pdfPath)
if ($pdfBytes.Length -lt 4 -or [Text.Encoding]::ASCII.GetString($pdfBytes[0..3]) -ne '%PDF') {
    throw 'Generated output does not have a PDF signature.'
}

$pdf = Get-Item -LiteralPath $pdfPath
Write-Output 'PDF_RENDER_COMMAND=chrome.exe --headless=new --print-to-pdf=<target> <local-html>'
Write-Output "PDF_RENDER_EXIT_CODE=$renderExitCode"
Write-Output "PDF_PATH=$($pdf.FullName)"
Write-Output "PDF_BYTES=$($pdf.Length)"
Write-Output "PDF_SHA256=$((Get-FileHash -LiteralPath $pdfPath -Algorithm SHA256).Hash.ToLowerInvariant())"
Write-Output "HTML_SUPPORT_PATH=$htmlPath"
