param(
    [string]$RemoteBaseUrl = 'https://dev-itkpress.itk.ac.id',
    [string]$LocalBaseUrl = 'http://localhost:8080'
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mirrorDir = Join-Path $scriptDir 'mirror'

$routes = @(
    '/home',
    '/home/index',
    '/home/catalog',
    '/home/search',
    '/home/about',
    '/home/about/submissions',
    '/home/about/privacy',
    '/home/announcement/view/12',
    '/home/catalog/book/92',
    '/home/catalog/book/55',
    '/home/catalog/book/50',
    '/home/catalog/book/49',
    '/home/catalog/book/43',
    '/home/catalog/book/41',
    '/home/catalog/book/37',
    '/home/catalog/book/38',
    '/home/catalog/book/39',
    '/home/catalog/book/7',
    '/home/catalog/book/1'
)

function Get-OutputPath {
    param([string]$Route)

    $trimmed = $Route.TrimStart('/')
    if ($trimmed -eq 'home') {
        return (Join-Path $mirrorDir 'home.html')
    }

    return (Join-Path $mirrorDir ($trimmed + '.html'))
}

function Rewrite-Content {
    param([string]$Html)

    $rewritten = $Html.Replace('https://dev-itkpress.itk.ac.id', $LocalBaseUrl)
    $rewritten = $rewritten.Replace('http://dev-itkpress.itk.ac.id', $LocalBaseUrl)
    $rewritten = $rewritten.Replace('https://itkpress.itk.ac.id/index.php', $LocalBaseUrl)
    $rewritten = $rewritten.Replace('http://itkpress.itk.ac.id/index.php', $LocalBaseUrl)
    $rewritten = $rewritten.Replace('https://itkpress.itk.ac.id', $LocalBaseUrl)
    $rewritten = $rewritten.Replace('http://itkpress.itk.ac.id', $LocalBaseUrl)
    return $rewritten
}

if (-not (Test-Path -LiteralPath $mirrorDir)) {
    New-Item -ItemType Directory -Path $mirrorDir -Force | Out-Null
}

foreach ($route in $routes) {
    $url = "$RemoteBaseUrl$route"
    $outputPath = Get-OutputPath -Route $route
    $parentDir = Split-Path -Parent $outputPath

    if (-not (Test-Path -LiteralPath $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }

    $response = Invoke-WebRequest -Uri $url -TimeoutSec 120
    $content = Rewrite-Content -Html $response.Content
    [System.IO.File]::WriteAllText($outputPath, $content, [System.Text.UTF8Encoding]::new($false))
    "Synced $route -> $outputPath"
}
