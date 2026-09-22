$ErrorActionPreference = "SilentlyContinue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$BASE = "https://dglets-agri-backend.onrender.com/api/v1"

function CallApi($method, $path, $body) {
    $headers = @{ "Content-Type" = "application/json" }
    $uri = "$BASE$path"
    if ($method -eq "GET") {
        $resp = Invoke-WebRequest $uri -Method GET -Headers $headers -UseBasicParsing -TimeoutSec 20
    } else {
        $resp = Invoke-WebRequest $uri -Method POST -Headers $headers -Body $body -UseBasicParsing -TimeoutSec 20
    }
    return $resp
}

# Step 1: Register users
Write-Host "=== Registering users ===" -ForegroundColor Cyan

$USERS = @(
    @{phone="08011111111"; role="FARMER";    fn="Musa";   ln="Abdullahi"; pw="Test1234!"},
    @{phone="08022222222"; role="BUYER";     fn="Chioma"; ln="Okafor";    pw="Test1234!"},
    @{phone="08033333333"; role="TRADER";    fn="Emeka";  ln="Nwosu";     pw="Test1234!"},
    @{phone="08044444444"; role="HAULAGE";   fn="Fatima"; ln="Bello";     pw="Test1234!"},
    @{phone="08055555555"; role="PROCESSOR"; fn="Yusuf";  ln="Ibrahim";   pw="Test1234!"},
    @{phone="08066666666"; role="EXPORTER";  fn="Ngozi";  ln="Eze";       pw="Test1234!"},
    @{phone="08070566642"; role="ADMIN";     fn="Daniel"; ln="Osadolor";  pw="Admin2026!"}
)

foreach ($u in $USERS) {
    $body = '{"firstName":"' + $u.fn + '","lastName":"' + $u.ln + '","phone":"' + $u.phone + '","role":"' + $u.role + '","password":"' + $u.pw + '"}'
    $resp = CallApi "POST" "/auth/register" $body
    if ($resp -and $resp.StatusCode -eq 200) {
        Write-Host "REGISTERED  [$($u.role)] $($u.fn) $($u.ln) ($($u.phone))" -ForegroundColor Green
    } else {
        Write-Host "EXISTS      [$($u.role)] $($u.fn) $($u.ln) ($($u.phone))" -ForegroundColor Yellow
    }
    Start-Sleep -Milliseconds 500
}

# Step 2: Activate all users
Write-Host "`n=== Activating users ===" -ForegroundColor Cyan

foreach ($u in $USERS) {
    $resp = CallApi "GET" "/auth/dev-activate/$($u.phone)?secret=dglets-dev-2026" $null
    if ($resp -and $resp.Content -match "activated") {
        Write-Host "ACTIVATED   [$($u.role)] $($u.phone)" -ForegroundColor Green
    } else {
        Write-Host "FAILED      [$($u.role)] $($u.phone) => $($resp.Content)" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 500
}

# Step 3: Test login for each user
Write-Host "`n=== Testing logins ===" -ForegroundColor Cyan

foreach ($u in $USERS) {
    $body = '{"identifier":"' + $u.phone + '","password":"' + $u.pw + '"}'
    $resp = CallApi "POST" "/auth/login" $body
    if ($resp -and $resp.StatusCode -eq 200) {
        $json = $resp.Content | ConvertFrom-Json
        if ($json.accessToken) {
            Write-Host "LOGIN OK    [$($u.role)] $($u.fn) $($u.ln) - Phone: $($u.phone)  Pass: $($u.pw)" -ForegroundColor Green
        } else {
            Write-Host "LOGIN FAIL  [$($u.role)] $($u.phone) => $($resp.Content.Substring(0,80))" -ForegroundColor Red
        }
    } else {
        Write-Host "LOGIN FAIL  [$($u.role)] $($u.phone)" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 500
}

Write-Host "`n=== All done ===" -ForegroundColor Cyan
Write-Host "Login credentials:" -ForegroundColor White
Write-Host "  FARMER    Musa Abdullahi     08011111111 / Test1234!" -ForegroundColor White
Write-Host "  BUYER     Chioma Okafor      08022222222 / Test1234!" -ForegroundColor White
Write-Host "  TRADER    Emeka Nwosu        08033333333 / Test1234!" -ForegroundColor White
Write-Host "  HAULAGE   Fatima Bello       08044444444 / Test1234!" -ForegroundColor White
Write-Host "  PROCESSOR Yusuf Ibrahim      08055555555 / Test1234!" -ForegroundColor White
Write-Host "  EXPORTER  Ngozi Eze          08066666666 / Test1234!" -ForegroundColor White
Write-Host "  ADMIN     Daniel Osadolor    08070566642 / Admin2026!" -ForegroundColor White
