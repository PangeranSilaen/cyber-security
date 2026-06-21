param(
    [string]$BaseUrl = 'http://localhost:8080',
    [string]$LoginArea = 'index',
    [string]$Username = 'admin',
    [string]$Password = 'admin123!',
    [string]$PressName = 'ITK Press',
    [string]$PressAcronym = 'ITKP',
    [string]$PressPath = 'home'
)

$ErrorActionPreference = 'Stop'

function Get-MatchValue {
    param(
        [string]$Text,
        [string]$Pattern
    )

    $match = [regex]::Match($Text, $Pattern)
    if (-not $match.Success) {
        throw "Pattern not found: $Pattern"
    }
    return $match.Groups[1].Value
}

$loginUrl = "$BaseUrl/$LoginArea/login"
$loginPage = Invoke-WebRequest -Uri $loginUrl -SessionVariable session
$loginHtml = $loginPage.Content
$loginCsrf = Get-MatchValue -Text $loginHtml -Pattern 'name="csrfToken" value="([^"]+)"'

$loginForm = @{
    csrfToken = $loginCsrf
    source = ''
    username = $Username
    password = $Password
    remember = '1'
}

Invoke-WebRequest -Uri "$BaseUrl/$LoginArea/login/signIn" -WebSession $session -Method Post -Body $loginForm | Out-Null

$targetPathUrl = "$BaseUrl/$PressPath"
try {
    $existing = Invoke-WebRequest -Uri $targetPathUrl -WebSession $session -MaximumRedirection 0 -ErrorAction Stop
    if ($existing.StatusCode -eq 200) {
        "Press path '$PressPath' already exists at $targetPathUrl"
        exit 0
    }
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 404) {
        throw
    }
}

$adminPage = Invoke-WebRequest -Uri "$BaseUrl/$LoginArea/admin/contexts" -WebSession $session
$adminHtml = $adminPage.Content
$apiCsrf = Get-MatchValue -Text $adminHtml -Pattern '"csrfToken":"([^"]+)"'

$headers = @{
    'x-csrf-token' = $apiCsrf
    'x-http-method-override' = 'POST'
    'x-requested-with' = 'XMLHttpRequest'
}

$body = @{
    'name[en_US]' = $PressName
    'acronym[en_US]' = $PressAcronym
    'description[en_US]' = ''
    'urlPath' = $PressPath
    'supportedLocales[]' = 'en_US'
    'primaryLocale' = 'en_US'
    'enabled' = 'true'
}

$response = Invoke-WebRequest -Uri "$BaseUrl/_/api/v1/contexts" -WebSession $session -Headers $headers -Method Post -Body $body
if ($response.StatusCode -ne 200) {
    throw "Create press request failed with status $($response.StatusCode)"
}

$homeCheck = Invoke-WebRequest -Uri $targetPathUrl -WebSession $session
if ($homeCheck.StatusCode -ne 200) {
    throw "Press path '$PressPath' was created but did not return HTTP 200"
}

"Press '$PressName' created successfully at $targetPathUrl"
