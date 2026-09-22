##############################################################
# DG-LETS — SMS (Termii) Test Script
# Tests OTP delivery directly against Termii API
# Run from anywhere:
#   cd "C:\Users\DELL\Desktop\DGLETS AGRI MART APP"
#   .\test-sms.ps1
##############################################################

param(
    [string]$ApiKey   = "",          # Override: .\test-sms.ps1 -ApiKey "your_key"
    [string]$Phone    = "",          # Override: .\test-sms.ps1 -Phone "08012345678"
    [string]$SenderId = "DG-LETS"
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# ── Load .env if no ApiKey passed ──────────────────────────
$envFile = "$PSScriptRoot\backend\.env"
$envVars = @{}

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*)\s*$') {
            $envVars[$matches[1].Trim()] = $matches[2].Trim()
        }
    }
}

if (-not $ApiKey) { $ApiKey   = $envVars["TERMII_API_KEY"]   }
if (-not $Phone)  { $Phone    = $envVars["TEST_PHONE"]        }
$SenderId = if ($envVars["TERMII_SENDER_ID"]) { $envVars["TERMII_SENDER_ID"] } else { $SenderId }
$BaseUrl  = if ($envVars["TERMII_BASE_URL"])  { $envVars["TERMII_BASE_URL"] }  else { "https://api.ng.termii.com" }

# ── Prompt for missing values ──────────────────────────────
Write-Host ""
Write-Host "  ██████╗  ██████╗      ██╗     ███████╗████████╗███████╗" -ForegroundColor Green
Write-Host "  ██╔══██╗██╔════╝      ██║     ██╔════╝╚══██╔══╝██╔════╝" -ForegroundColor Green
Write-Host "  ██║  ██║██║  ███╗     ██║     █████╗     ██║   ███████╗" -ForegroundColor Green
Write-Host "  ██║  ██║██║   ██║     ██║     ██╔══╝     ██║   ╚════██║" -ForegroundColor Green
Write-Host "  ██████╔╝╚██████╔╝     ███████╗███████╗   ██║   ███████║" -ForegroundColor Green
Write-Host "  ╚═════╝  ╚═════╝      ╚══════╝╚══════╝   ╚═╝   ╚══════╝" -ForegroundColor Green
Write-Host "  DG-LETS Agri Market — SMS Test Tool" -ForegroundColor Cyan
Write-Host ""

if (-not $ApiKey) {
    Write-Host "  [?] TERMII_API_KEY not found in .env" -ForegroundColor Yellow
    $ApiKey = Read-Host "  Enter your Termii API key (or press Enter to test in mock mode)"
}

if (-not $Phone) {
    $Phone = Read-Host "  Enter test phone number (Nigerian format e.g. 08012345678)"
}

if (-not $Phone) {
    Write-Host "  [!] No phone number provided. Exiting." -ForegroundColor Red
    exit 1
}

# ── Normalise phone ────────────────────────────────────────
$digits = $Phone -replace '\D', ''
if ($digits.StartsWith("234"))     { $normalised = $digits }
elseif ($digits.StartsWith("0"))   { $normalised = "234" + $digits.Substring(1) }
else                               { $normalised = $digits }

$otp     = (Get-Random -Minimum 100000 -Maximum 999999).ToString()
$message = "Your DG-LETS verification code is: $otp. Valid for 10 minutes. Do not share this code."

Write-Host ""
Write-Host "  ─────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Target phone  : $Phone → +$normalised"   -ForegroundColor White
Write-Host "  Sender ID     : $SenderId"                -ForegroundColor White
Write-Host "  OTP (test)    : $otp"                     -ForegroundColor Cyan
Write-Host "  Message       : $message"                 -ForegroundColor White
Write-Host "  ─────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ── MOCK MODE (no API key) ─────────────────────────────────
if (-not $ApiKey -or $ApiKey -eq "") {
    Write-Host "  ⚠  MOCK MODE — no Termii API key configured" -ForegroundColor Yellow
    Write-Host "  ✓  SMS would be sent to +$normalised"       -ForegroundColor Green
    Write-Host "  ✓  OTP: $otp"                               -ForegroundColor Green
    Write-Host ""
    Write-Host "  To send real SMS:"                           -ForegroundColor White
    Write-Host "    1. Add TERMII_API_KEY=<key> to backend\.env" -ForegroundColor White
    Write-Host "    2. Re-run this script"                     -ForegroundColor White
    Write-Host ""
    exit 0
}

# ── BALANCE CHECK ─────────────────────────────────────────
Write-Host "  [1/3] Checking Termii account balance…" -ForegroundColor Cyan
try {
    $balResp = Invoke-RestMethod `
        -Uri     "$BaseUrl/api/get-balance" `
        -Method  GET `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body    (ConvertTo-Json @{ api_key = $ApiKey }) `
        -TimeoutSec 15

    $balance = $balResp.balance
    Write-Host "  ✓  Balance: ₦$balance" -ForegroundColor Green

    if ([double]$balance -lt 10) {
        Write-Host "  ⚠  Low balance — top up your Termii account before going live" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠  Could not check balance: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "     (Continuing with send test anyway…)" -ForegroundColor DarkGray
}

# ── SEND TEST SMS ─────────────────────────────────────────
Write-Host ""
Write-Host "  [2/3] Sending test OTP SMS…" -ForegroundColor Cyan

$body = @{
    to       = $normalised
    from     = $SenderId
    sms      = $message
    type     = "plain"
    channel  = "dnd"
    api_key  = $ApiKey
} | ConvertTo-Json

try {
    $resp = Invoke-RestMethod `
        -Uri         "$BaseUrl/api/sms/send" `
        -Method      POST `
        -ContentType "application/json" `
        -Body        $body `
        -TimeoutSec  20

    Write-Host ""
    if ($resp.message_id -or $resp.message -match "Successfully") {
        Write-Host "  ✅  SMS SENT SUCCESSFULLY" -ForegroundColor Green
        Write-Host "  Message ID : $($resp.message_id)" -ForegroundColor White
        Write-Host "  Status     : $($resp.message)"    -ForegroundColor White
        Write-Host "  Balance    : ₦$($resp.balance)"   -ForegroundColor White
    } else {
        Write-Host "  ❌  Termii returned an error:" -ForegroundColor Red
        Write-Host "  $($resp | ConvertTo-Json -Depth 3)" -ForegroundColor Red
    }
} catch {
    $errBody = $_.ErrorDetails.Message
    Write-Host "  ❌  Request failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($errBody) {
        Write-Host "  Response: $errBody" -ForegroundColor Red
        # Common errors
        if ($errBody -match "api_key") {
            Write-Host ""
            Write-Host "  → Invalid API key. Check TERMII_API_KEY in backend\.env" -ForegroundColor Yellow
        }
        if ($errBody -match "DND|sender") {
            Write-Host ""
            Write-Host "  → Sender ID issue. Try channel 'generic' or register '$SenderId' with Termii." -ForegroundColor Yellow
        }
    }
    exit 1
}

# ── VERIFY via backend (if running) ───────────────────────
Write-Host ""
Write-Host "  [3/3] Checking if backend OTP flow also works…" -ForegroundColor Cyan

$backendUrl = if ($envVars["EXPO_PUBLIC_API_URL"]) {
    $envVars["EXPO_PUBLIC_API_URL"] -replace "/api/v1$", ""
} else {
    "http://localhost:3000"
}

# Quick register test to trigger the OTP flow
$testPhone = "0800TEST$(Get-Random -Minimum 1000 -Maximum 9999)"
$regBody   = @{
    phone     = $testPhone
    firstName = "SMS"
    lastName  = "Test"
    password  = "Test1234!"
    role      = "BUYER"
} | ConvertTo-Json

try {
    $regResp = Invoke-RestMethod `
        -Uri         "$backendUrl/api/v1/auth/register" `
        -Method      POST `
        -ContentType "application/json" `
        -Body        $regBody `
        -TimeoutSec  5

    if ($regResp.userId) {
        Write-Host "  ✅  Backend OTP flow works — userId: $($regResp.userId)" -ForegroundColor Green
        Write-Host "     OTP was triggered for $testPhone (check server logs if TERMII_API_KEY not set)" -ForegroundColor DarkGray
    }
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 409) {
        Write-Host "  ✅  Backend is running (got 409 conflict — expected for duplicate phone)" -ForegroundColor Green
    } elseif ($code) {
        Write-Host "  ⚠  Backend returned HTTP $code" -ForegroundColor Yellow
    } else {
        Write-Host "  ⚠  Backend not reachable at $backendUrl — start it first with 'npm run start:dev'" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "  ─────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  SMS test complete." -ForegroundColor Cyan
Write-Host "  Check your phone (+$normalised) for the OTP: $otp" -ForegroundColor Green
Write-Host "  ─────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
