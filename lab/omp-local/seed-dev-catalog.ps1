param(
    [string]$MirrorCatalogPath = 'lab/omp-local/mirror/home/catalog.html',
    [int]$Limit = 0,
    [switch]$SkipAssetSync
)

$ErrorActionPreference = 'Stop'

function Normalize-HtmlText {
    param([string]$Value)

    $decoded = [System.Net.WebUtility]::HtmlDecode($Value)
    $decoded = [regex]::Replace($decoded, '\s+', ' ')
    return $decoded.Trim()
}

function Get-CatalogItems {
    param([string]$CatalogHtml)

    $pattern = '<div class="obj_monograph_summary(?<featured> is_featured)?">.*?<a href="http://localhost:8080/home/catalog/book/(?<id>\d+)" class="cover">.*?src="http://localhost:8080/public/presses/2/(?<thumb>[^"]+)".*?<h2 class="title">\s*<a [^>]+>\s*(?<title>.*?)\s*</a>\s*</h2>\s*<div class="author">\s*(?<author>.*?)\s*</div>\s*<div class="date">\s*(?<date>.*?)\s*</div>'
    $options = [System.Text.RegularExpressions.RegexOptions]::Singleline
    $matches = [regex]::Matches($CatalogHtml, $pattern, $options)

    $items = foreach ($match in $matches) {
        $id = [int]$match.Groups['id'].Value
        $thumb = $match.Groups['thumb'].Value
        $full = $thumb -replace '_t\.jpg$', '.jpg'
        $dateValue = Normalize-HtmlText $match.Groups['date'].Value
        $parsedDate = [datetime]::Parse($dateValue, [System.Globalization.CultureInfo]::GetCultureInfo('en-US'))

        [pscustomobject]@{
            Id = $id
            Title = Normalize-HtmlText $match.Groups['title'].Value
            Author = Normalize-HtmlText $match.Groups['author'].Value
            DatePublished = $parsedDate.ToString('yyyy-MM-dd')
            ThumbFile = $thumb
            FullFile = $full
            IsFeatured = $match.Groups['featured'].Success
        }
    }

    return $items
}

function Escape-Sql {
    param([string]$Value)
    if ($null -eq $Value) { return '' }
    return $Value.Replace("'", "''")
}

function Serialize-CoverImage {
    param(
        [string]$UploadName,
        [string]$DateUploaded
    )

    return ('a:3:{{s:10:"uploadName";s:{0}:"{1}";s:12:"dateUploaded";s:10:"{2}";s:7:"altText";s:0:"";}}' -f $UploadName.Length, $UploadName, $DateUploaded)
}

if (-not $SkipAssetSync) {
    pwsh -File 'lab/omp-local/sync-dev-assets.ps1' | Out-Null
}

$catalogHtml = [System.IO.File]::ReadAllText((Resolve-Path $MirrorCatalogPath))
$items = @(Get-CatalogItems -CatalogHtml $catalogHtml)

if ($Limit -gt 0) {
    $items = @($items | Select-Object -First $Limit)
}

if ($items.Count -eq 0) {
    throw 'No catalog items were parsed from the mirrored catalog HTML.'
}

$idList = ($items | ForEach-Object { $_.Id }) -join ', '
$sqlLines = New-Object System.Collections.Generic.List[string]
$sqlLines.Add("DELETE FROM features WHERE submission_id IN ($idList);")
$sqlLines.Add("DELETE FROM new_releases WHERE submission_id IN ($idList);")
$sqlLines.Add("DELETE FROM author_settings WHERE author_id IN ($idList);")
$sqlLines.Add("DELETE FROM authors WHERE publication_id IN ($idList);")
$sqlLines.Add("DELETE FROM publication_settings WHERE publication_id IN ($idList);")
$sqlLines.Add("DELETE FROM publications WHERE publication_id IN ($idList);")
$sqlLines.Add("DELETE FROM submission_settings WHERE submission_id IN ($idList);")
$sqlLines.Add("DELETE FROM submissions WHERE submission_id IN ($idList);")
$sqlLines.Add("DELETE FROM press_settings WHERE press_id = 1 AND setting_name = 'catalogSortOption';")
$sqlLines.Add("INSERT INTO press_settings (press_id, locale, setting_name, setting_value) VALUES (1, 'en_US', 'catalogSortOption', 'seq-ASC');")

$seq = 1
foreach ($item in $items) {
    $title = Escape-Sql $item.Title
    $author = Escape-Sql $item.Author
    $coverSerialized = Escape-Sql (Serialize-CoverImage -UploadName $item.FullFile -DateUploaded $item.DatePublished)

    $sqlLines.Add(@"
INSERT INTO submissions (submission_id, context_id, current_publication_id, date_last_activity, date_submitted, last_modified, stage_id, locale, status, submission_progress, work_type)
VALUES ($($item.Id), 1, $($item.Id), NOW(), '$($item.DatePublished) 00:00:00', NOW(), 5, 'en_US', 3, 0, 2);
"@.Trim())

    $sqlLines.Add(@"
INSERT INTO publications (publication_id, date_published, last_modified, locale, primary_contact_id, publication_date_type, publication_type, seq, series_id, series_position, submission_id, status, url_path, version)
VALUES ($($item.Id), '$($item.DatePublished)', NOW(), 'en_US', $($item.Id), 'pub', 'publication', $seq, NULL, NULL, $($item.Id), 3, NULL, 1);
"@.Trim())

    $sqlLines.Add(@"
INSERT INTO publication_settings (publication_id, locale, setting_name, setting_value) VALUES
($($item.Id), 'en_US', 'title', '$title'),
($($item.Id), 'en_US', 'coverImage', '$coverSerialized'),
($($item.Id), 'en_US', 'copyrightHolder', '$author');
"@.Trim())

    $sqlLines.Add(@"
INSERT INTO authors (author_id, email, include_in_browse, publication_id, seq, user_group_id)
VALUES ($($item.Id), 'seed-book-$($item.Id)@localhost', 1, $($item.Id), 1.00, 13);
"@.Trim())

    $sqlLines.Add(@"
INSERT INTO author_settings (author_id, locale, setting_name, setting_value) VALUES
($($item.Id), 'en_US', 'givenName', '$author'),
($($item.Id), 'en_US', 'familyName', ''),
($($item.Id), 'en_US', 'preferredPublicName', '$author');
"@.Trim())

    $sqlLines.Add("INSERT INTO new_releases (submission_id, assoc_type, assoc_id) VALUES ($($item.Id), 512, 1);")
    if ($item.IsFeatured) {
        $sqlLines.Add("INSERT INTO features (submission_id, assoc_type, assoc_id, seq) VALUES ($($item.Id), 512, 1, $seq);")
    }
    $seq++
}

$sql = [string]::Join([Environment]::NewLine, $sqlLines)
$sqlPath = Join-Path $env:TEMP 'omp-seed-dev-catalog.sql'
[System.IO.File]::WriteAllText($sqlPath, $sql, [System.Text.UTF8Encoding]::new($false))

Get-Content -LiteralPath $sqlPath | docker compose --env-file "lab/omp-local/.env.example" -f "lab/omp-local/docker-compose.yml" exec -T db sh -lc 'mysql -uomp -pomp -D omp'

"Seeded $($items.Count) real catalog items into local OMP."
