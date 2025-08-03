# Comprehensive API Testing Script
Write-Host "Starting Comprehensive API Testing..." -ForegroundColor Green

# Base URL
$baseUrl = "http://localhost:5000/api"

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET
    Write-Host "Health Check: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Authentication APIs
Write-Host "`n2. Testing Authentication APIs..." -ForegroundColor Yellow

# Test Login
Write-Host "Testing Login..." -ForegroundColor Cyan
try {
    $loginData = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/v1/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "Login: $($response.StatusCode)" -ForegroundColor Green
    $loginResponse = $response.Content | ConvertFrom-Json
    $token = $loginResponse.data.token
    Write-Host "Token received: $($token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "Login Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Profile
Write-Host "Testing Profile..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/auth/profile" -Method GET -Headers $headers
    Write-Host "Profile: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Profile Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Applications APIs
Write-Host "`n3. Testing Applications APIs..." -ForegroundColor Yellow

# Get All Applications
Write-Host "Testing Get All Applications..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/applications" -Method GET -Headers $headers
    Write-Host "Get Applications: $($response.StatusCode)" -ForegroundColor Green
    $appsResponse = $response.Content | ConvertFrom-Json
    Write-Host "Found $($appsResponse.data.Count) applications" -ForegroundColor Gray
} catch {
    Write-Host "Get Applications Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Accounts APIs
Write-Host "`n4. Testing Accounts APIs..." -ForegroundColor Yellow

# Get All Accounts
Write-Host "Testing Get All Accounts..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/accounts" -Method GET -Headers $headers
    Write-Host "Get Accounts: $($response.StatusCode)" -ForegroundColor Green
    $accountsResponse = $response.Content | ConvertFrom-Json
    Write-Host "Found $($accountsResponse.data.Count) accounts" -ForegroundColor Gray
} catch {
    Write-Host "Get Accounts Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Users APIs
Write-Host "`n5. Testing Users APIs..." -ForegroundColor Yellow

# Get All Users
Write-Host "Testing Get All Users..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/users" -Method GET -Headers $headers
    Write-Host "Get Users: $($response.StatusCode)" -ForegroundColor Green
    $usersResponse = $response.Content | ConvertFrom-Json
    Write-Host "Found $($usersResponse.data.Count) users" -ForegroundColor Gray
} catch {
    Write-Host "Get Users Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Rights APIs
Write-Host "`n6. Testing Rights APIs..." -ForegroundColor Yellow

# Get All Rights
Write-Host "Testing Get All Rights..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights" -Method GET -Headers $headers
    Write-Host "Get Rights: $($response.StatusCode)" -ForegroundColor Green
    $rightsResponse = $response.Content | ConvertFrom-Json
    Write-Host "Found $($rightsResponse.data.Count) rights" -ForegroundColor Gray
} catch {
    Write-Host "Get Rights Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: App-X Integration APIs
Write-Host "`n7. Testing App-X Integration APIs..." -ForegroundColor Yellow

# Health Check
Write-Host "Testing App-X Health Check..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/app-x/health" -Method GET
    Write-Host "App-X Health: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "App-X Health Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Get All Applications (App-X)
Write-Host "Testing App-X Get Applications..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/app-x/applications" -Method GET
    Write-Host "App-X Applications: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "App-X Applications Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nAPI Testing Complete!" -ForegroundColor Green 