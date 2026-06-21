param(
    [string]$RemoteBaseUrl = 'https://dev-itkpress.itk.ac.id',
    [string]$MirrorCatalogPath = 'lab/omp-local/mirror/home/catalog.html'
)

$ErrorActionPreference = 'Stop'

function Get-CatalogAssetNames {
    param([string]$CatalogHtml)

    $names = [System.Collections.Generic.HashSet[string]]::new()
    $headerMatch = [regex]::Match($CatalogHtml, 'pageHeaderLogoImage_en_US\.png')
    if ($headerMatch.Success) {
        $null = $names.Add('pageHeaderLogoImage_en_US.png')
    }

    foreach ($match in [regex]::Matches($CatalogHtml, 'submission_(\d+)_(\d+)_coverImage_en_US_t\.jpg')) {
        $thumb = $match.Value
        $full = $thumb -replace '_t\.jpg$', '.jpg'
        $null = $names.Add($thumb)
        $null = $names.Add($full)
    }

    return $names
}

$catalogHtml = [System.IO.File]::ReadAllText((Resolve-Path $MirrorCatalogPath))
$assetNames = Get-CatalogAssetNames -CatalogHtml $catalogHtml

if ($assetNames.Count -eq 0) {
    throw 'No catalog assets were detected from the mirrored catalog HTML.'
}

$downloadScript = @()
$downloadScript += 'set -eu'
$downloadScript += 'mkdir -p /var/www/html/public/presses/1 /var/www/html/public/presses/2'
foreach ($assetName in $assetNames) {
    $remoteUrl = "$RemoteBaseUrl/public/presses/2/$assetName"
    $downloadScript += "curl -fsSL '$remoteUrl' -o '/var/www/html/public/presses/1/$assetName'"
    $downloadScript += "cp '/var/www/html/public/presses/1/$assetName' '/var/www/html/public/presses/2/$assetName'"
}

$shellScript = [string]::Join('; ', $downloadScript)

docker compose --env-file "lab/omp-local/.env.example" -f "lab/omp-local/docker-compose.yml" exec app sh -lc $shellScript | Out-Null

$logoSerialized = 'a:3:{s:10:"uploadName";s:30:"pageHeaderLogoImage_en_US.png";s:12:"dateUploaded";s:10:"2026-06-21";s:7:"altText";s:0:"";}'
$sql = @"
DELETE FROM press_settings WHERE press_id = 1 AND setting_name IN ('pageHeaderLogoImage', 'pageHeaderLogoImageAltText');
INSERT INTO press_settings (press_id, locale, setting_name, setting_value) VALUES
(1, 'en_US', 'pageHeaderLogoImage', '$logoSerialized'),
(1, 'en_US', 'pageHeaderLogoImageAltText', 'ITK Press');
"@

$sqlPath = Join-Path $env:TEMP 'omp-sync-assets.sql'
[System.IO.File]::WriteAllText($sqlPath, $sql, [System.Text.UTF8Encoding]::new($false))
Get-Content -LiteralPath $sqlPath | docker compose --env-file "lab/omp-local/.env.example" -f "lab/omp-local/docker-compose.yml" exec -T db sh -lc 'mysql -uomp -pomp -D omp' | Out-Null

"Synced $($assetNames.Count) public assets and applied local header logo setting."
