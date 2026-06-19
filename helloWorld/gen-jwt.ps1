# Genera un JWT de prueba leyendo JWT_SECRET desde el archivo .env

$envFile = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envFile)) {
    Write-Error "No se encontro el archivo .env en: $envFile"
    exit 1
}

# Leer JWT_SECRET del .env
$secret = $null
foreach ($line in Get-Content $envFile) {
    if ($line -match '^\s*JWT_SECRET\s*=\s*(.+)$') {
        $secret = $Matches[1].Trim()
        break
    }
}

if (-not $secret) {
    Write-Error "JWT_SECRET no encontrado en el archivo .env"
    exit 1
}

# Generar timestamps
$iat = [int](([datetime]::UtcNow - [datetime]'1970-01-01').TotalSeconds)
$exp = $iat + 3600

# Construir header y payload en Base64URL
$header  = [Convert]::ToBase64String(
    [Text.Encoding]::UTF8.GetBytes('{"alg":"HS256","typ":"JWT"}')
) -replace '=+$','' -replace '\+','-' -replace '/','_'

$payloadJson = "{`"id`":1,`"name`":`"Test User`",`"email`":`"test@test.com`",`"iat`":$iat,`"exp`":$exp}"
$payload = [Convert]::ToBase64String(
    [Text.Encoding]::UTF8.GetBytes($payloadJson)
) -replace '=+$','' -replace '\+','-' -replace '/','_'

# Firmar con HMAC-SHA256
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($secret)
$sig = [Convert]::ToBase64String(
    $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes("$header.$payload"))
) -replace '=+$','' -replace '\+','-' -replace '/','_'

$token = "$header.$payload.$sig"

Write-Host ""
Write-Host "JWT_SECRET : $secret" -ForegroundColor Yellow
Write-Host "JWT Token  : $token" -ForegroundColor Cyan
Write-Host ""
