[CmdletBinding()]
param(
    [string[]]$SubscriptionId,
    [string]$ProposedVnetCidr = "10.219.0.0/20",
    [string]$ProposedContainerAppsSubnetCidr = "10.219.0.0/23",
    [string]$ProposedPrivateEndpointSubnetCidr = "10.219.2.0/24",
    [string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot)
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$cidrPattern = "(?<![0-9.])(?<cidr>(?:[0-9]{1,3}\.){3}[0-9]{1,3}/(?:[0-9]|[12][0-9]|3[0-2]))(?![0-9])"

function Invoke-AzReadOnlyJson {
    param(
        [Parameter(Mandatory)]
        [string[]]$Arguments
    )

    $output = & az @Arguments --only-show-errors -o json
    if ($LASTEXITCODE -ne 0) {
        throw "Azure CLI read-only command failed: az $($Arguments -join ' ')"
    }

    if ([string]::IsNullOrWhiteSpace(($output -join [Environment]::NewLine))) {
        return $null
    }

    return (($output -join [Environment]::NewLine) | ConvertFrom-Json)
}

function ConvertTo-CidrRange {
    param(
        [Parameter(Mandatory)]
        [string]$Cidr
    )

    $parts = $Cidr.Split("/")
    if ($parts.Count -ne 2) {
        throw "Invalid CIDR: $Cidr"
    }

    $address = $null
    if (-not [System.Net.IPAddress]::TryParse($parts[0], [ref]$address)) {
        throw "Invalid IPv4 address in CIDR: $Cidr"
    }

    $bytes = $address.GetAddressBytes()
    if ($bytes.Count -ne 4) {
        throw "Only IPv4 CIDRs are supported: $Cidr"
    }

    $prefixLength = 0
    if (-not [int]::TryParse($parts[1], [ref]$prefixLength) -or $prefixLength -lt 0 -or $prefixLength -gt 32) {
        throw "Invalid IPv4 prefix length in CIDR: $Cidr"
    }

    $addressValue =
        ([uint64]$bytes[0] * 16777216) +
        ([uint64]$bytes[1] * 65536) +
        ([uint64]$bytes[2] * 256) +
        [uint64]$bytes[3]
    $rangeSize = [uint64][Math]::Pow(2, 32 - $prefixLength)
    $networkValue = [uint64]([Math]::Floor($addressValue / $rangeSize) * $rangeSize)
    $broadcastValue = $networkValue + $rangeSize - 1

    if ($addressValue -ne $networkValue) {
        throw "CIDR is not expressed with its network address: $Cidr"
    }

    return [pscustomobject]@{
        cidr   = $Cidr
        start  = $networkValue
        end    = $broadcastValue
        prefix = $prefixLength
    }
}

function Test-CidrOverlap {
    param(
        [Parameter(Mandatory)]
        [pscustomobject]$Left,
        [Parameter(Mandatory)]
        [pscustomobject]$Right
    )

    return $Left.start -le $Right.end -and $Right.start -le $Left.end
}

function Test-CidrContains {
    param(
        [Parameter(Mandatory)]
        [pscustomobject]$Parent,
        [Parameter(Mandatory)]
        [pscustomobject]$Child
    )

    return $Parent.start -le $Child.start -and $Parent.end -ge $Child.end
}

function Find-CidrsInObject {
    param(
        [AllowNull()]
        [object]$Value,
        [Parameter(Mandatory)]
        [string]$Path,
        [Parameter(Mandatory)]
        [string]$Subscription,
        [Parameter(Mandatory)]
        [AllowEmptyCollection()]
        [System.Collections.Generic.List[object]]$Results
    )

    if ($null -eq $Value) {
        return
    }

    if ($Value -is [string]) {
        foreach ($match in [regex]::Matches($Value, $cidrPattern)) {
            $candidate = $match.Groups["cidr"].Value
            try {
                $null = ConvertTo-CidrRange -Cidr $candidate
                $Results.Add([pscustomobject]@{
                    cidr           = $candidate
                    subscriptionId = $Subscription
                    source         = $Path
                })
            }
            catch {
                # Ignore strings that resemble CIDRs but are not valid network ranges.
            }
        }
        return
    }

    if ($Value -is [System.Collections.IDictionary]) {
        foreach ($key in $Value.Keys) {
            Find-CidrsInObject -Value $Value[$key] -Path "$Path.$key" -Subscription $Subscription -Results $Results
        }
        return
    }

    if ($Value -is [System.Collections.IEnumerable]) {
        $index = 0
        foreach ($item in $Value) {
            Find-CidrsInObject -Value $item -Path "$Path[$index]" -Subscription $Subscription -Results $Results
            $index++
        }
        return
    }

    foreach ($property in $Value.PSObject.Properties) {
        Find-CidrsInObject -Value $property.Value -Path "$Path.$($property.Name)" -Subscription $Subscription -Results $Results
    }
}

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw "Azure CLI was not found."
}

$repositoryPath = (Resolve-Path -LiteralPath $RepositoryRoot).Path
$infrastructurePath = Join-Path $repositoryPath "infrastructure"
if (-not (Test-Path -LiteralPath $infrastructurePath -PathType Container)) {
    throw "Infrastructure directory was not found under repository root: $repositoryPath"
}

$cliVersionObject = Invoke-AzReadOnlyJson -Arguments @("version")
$subscriptions = @(
    Invoke-AzReadOnlyJson -Arguments @(
        "account",
        "list",
        "--all",
        "--query",
        "[?state=='Enabled'].{id:id,name:name,isDefault:isDefault,state:state}"
    )
)

if ($SubscriptionId -and $SubscriptionId.Count -gt 0) {
    $selectedSubscriptions = @($subscriptions | Where-Object { $SubscriptionId -contains $_.id })
    $unknownSubscriptions = @($SubscriptionId | Where-Object { $_ -notin $subscriptions.id })
    if ($unknownSubscriptions.Count -gt 0) {
        throw "Requested subscription is not enabled or accessible: $($unknownSubscriptions -join ', ')"
    }
}
else {
    $selectedSubscriptions = $subscriptions
}

if ($selectedSubscriptions.Count -eq 0) {
    throw "No enabled Azure subscriptions are accessible to the current Azure CLI session."
}

$networkResources = [System.Collections.Generic.List[object]]::new()
$observedAzureCidrs = [System.Collections.Generic.List[object]]::new()

foreach ($subscription in $selectedSubscriptions) {
    $resources = @(
        Invoke-AzReadOnlyJson -Arguments @(
            "resource",
            "list",
            "--subscription",
            $subscription.id,
            "--query",
            "[?starts_with(type, 'Microsoft.Network/')].{id:id,name:name,resourceGroup:resourceGroup,location:location,type:type}"
        )
    )

    foreach ($resource in $resources) {
        $networkResources.Add([pscustomobject]@{
            subscriptionId = $subscription.id
            id             = $resource.id
            name           = $resource.name
            resourceGroup  = $resource.resourceGroup
            location       = $resource.location
            type           = $resource.type
        })

        $resourceDetail = Invoke-AzReadOnlyJson -Arguments @(
            "resource",
            "show",
            "--ids",
            $resource.id
        )
        Find-CidrsInObject `
            -Value $resourceDetail `
            -Path "azureResource:$($resource.id)" `
            -Subscription $subscription.id `
            -Results $observedAzureCidrs
    }

    $vnets = @(
        Invoke-AzReadOnlyJson -Arguments @(
            "network",
            "vnet",
            "list",
            "--subscription",
            $subscription.id
        )
    )
    Find-CidrsInObject `
        -Value $vnets `
        -Path "azureVnetList:$($subscription.id)" `
        -Subscription $subscription.id `
        -Results $observedAzureCidrs
}

$observedAzureCidrs = @(
    $observedAzureCidrs |
        Sort-Object subscriptionId, cidr, source -Unique
)

$observedRepositoryCidrs = [System.Collections.Generic.List[object]]::new()
$terraformFiles = @(
    Get-ChildItem -LiteralPath $infrastructurePath -Recurse -File |
        Where-Object {
            $_.FullName -notmatch "[\\/]\.terraform[\\/]" -and
            $_.Extension -in @(".tf", ".tfvars", ".hcl")
        }
)

foreach ($file in $terraformFiles) {
    $relativePath = $file.FullName.Substring($repositoryPath.Length).TrimStart([char]92, [char]47).Replace("\", "/")
    $lineNumber = 0
    foreach ($line in Get-Content -LiteralPath $file.FullName) {
        $lineNumber++
        foreach ($match in [regex]::Matches($line, $cidrPattern)) {
            $candidate = $match.Groups["cidr"].Value
            try {
                $null = ConvertTo-CidrRange -Cidr $candidate
                $observedRepositoryCidrs.Add([pscustomobject]@{
                    cidr   = $candidate
                    source = "${relativePath}:$lineNumber"
                })
            }
            catch {
                # Ignore strings that resemble CIDRs but are not valid network ranges.
            }
        }
    }
}

$observedRepositoryCidrs = @(
    $observedRepositoryCidrs |
        Sort-Object cidr, source -Unique
)

$proposal = [ordered]@{
    vnet                    = ConvertTo-CidrRange -Cidr $ProposedVnetCidr
    containerAppsSubnet     = ConvertTo-CidrRange -Cidr $ProposedContainerAppsSubnetCidr
    privateEndpointSubnet   = ConvertTo-CidrRange -Cidr $ProposedPrivateEndpointSubnetCidr
}

$restrictedCidrs = @(
    "100.100.0.0/17",
    "100.100.128.0/19",
    "100.100.160.0/19",
    "100.100.192.0/19",
    "169.254.0.0/16",
    "172.30.0.0/16",
    "172.31.0.0/16",
    "192.0.2.0/24"
)

$observedOverlap = [System.Collections.Generic.List[object]]::new()
foreach ($observed in @($observedAzureCidrs) + @($observedRepositoryCidrs)) {
    $observedRange = ConvertTo-CidrRange -Cidr $observed.cidr
    if (Test-CidrOverlap -Left $proposal.vnet -Right $observedRange) {
        $observedOverlap.Add([pscustomobject]@{
            proposedCidr = $proposal.vnet.cidr
            observedCidr = $observed.cidr
            source       = $observed.source
        })
    }
}

$restrictedOverlap = [System.Collections.Generic.List[object]]::new()
foreach ($restrictedCidr in $restrictedCidrs) {
    $restrictedRange = ConvertTo-CidrRange -Cidr $restrictedCidr
    if (Test-CidrOverlap -Left $proposal.vnet -Right $restrictedRange) {
        $restrictedOverlap.Add([pscustomobject]@{
            proposedCidr   = $proposal.vnet.cidr
            restrictedCidr = $restrictedCidr
        })
    }
}

$containerAppsContained = Test-CidrContains -Parent $proposal.vnet -Child $proposal.containerAppsSubnet
$privateEndpointContained = Test-CidrContains -Parent $proposal.vnet -Child $proposal.privateEndpointSubnet
$subnetsOverlap = Test-CidrOverlap -Left $proposal.containerAppsSubnet -Right $proposal.privateEndpointSubnet
$automatedChecksPassed =
    $containerAppsContained -and
    $privateEndpointContained -and
    -not $subnetsOverlap -and
    $observedOverlap.Count -eq 0 -and
    $restrictedOverlap.Count -eq 0

$result = [ordered]@{
    schemaVersion = 1
    generatedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
    executionMode = "READ_ONLY"
    azureCliVersion = $cliVersionObject."azure-cli"
    commandAllowlist = @(
        "az version",
        "az account list --all",
        "az resource list",
        "az resource show",
        "az network vnet list"
    )
    scope = [ordered]@{
        subscriptions = @(
            $selectedSubscriptions | ForEach-Object {
                [ordered]@{
                    id = $_.id
                    name = $_.name
                    state = $_.state
                    isDefault = $_.isDefault
                }
            }
        )
        repositoryCidrScan = "infrastructure/**/*.{tf,tfvars,hcl}, excluding infrastructure/.terraform"
    }
    inventory = [ordered]@{
        microsoftNetworkResourceCount = $networkResources.Count
        microsoftNetworkResources = @($networkResources)
        azureCidrCount = $observedAzureCidrs.Count
        azureCidrs = @($observedAzureCidrs)
        repositoryPlannedCidrCount = $observedRepositoryCidrs.Count
        repositoryPlannedCidrs = @($observedRepositoryCidrs)
    }
    proposal = [ordered]@{
        vnetCidr = $proposal.vnet.cidr
        containerAppsSubnetCidr = $proposal.containerAppsSubnet.cidr
        privateEndpointSubnetCidr = $proposal.privateEndpointSubnet.cidr
    }
    analysis = [ordered]@{
        containerAppsSubnetContainedByVnet = $containerAppsContained
        privateEndpointSubnetContainedByVnet = $privateEndpointContained
        proposedSubnetsOverlap = $subnetsOverlap
        observedOverlapCount = $observedOverlap.Count
        observedOverlaps = @($observedOverlap)
        restrictedRangeOverlapCount = $restrictedOverlap.Count
        restrictedRangeOverlaps = @($restrictedOverlap)
        automatedChecksPassed = $automatedChecksPassed
        result = if ($automatedChecksPassed) {
            "NO_OVERLAP_FOUND_WITHIN_OBSERVED_SCOPE"
        }
        else {
            "OVERLAP_OR_LAYOUT_FAILURE_FOUND"
        }
    }
    ownerConfirmation = [ordered]@{
        required = $true
        reason = "Azure and repository discovery cannot observe on-premises, VPN-advertised, other-cloud, separately managed IPAM, or undocumented planned ranges."
        confirmedNoOverlap = $null
    }
}

$result | ConvertTo-Json -Depth 20
