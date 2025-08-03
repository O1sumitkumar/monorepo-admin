Write-Host "Testing Rights API with Debugging..." -ForegroundColor Yellow

$baseUrl = "http://localhost:5000/api"

# Step 1: Login to get fresh token
Write-Host "`n1. Getting fresh authentication token..." -ForegroundColor Green
try {
    $loginData = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/v1/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $loginResponse = $response.Content | ConvertFrom-Json
    
    if ($loginResponse.success) {
        $token = $loginResponse.data.token
        Write-Host "✅ Login successful, token received" -ForegroundColor Green
    } else {
        Write-Host "❌ Login failed: $($loginResponse.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Login request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Test Rights API with detailed headers
Write-Host "`n2. Testing Rights API..." -ForegroundColor Green
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

Write-Host "Request URL: $baseUrl/v1/rights" -ForegroundColor Gray
Write-Host "Request Method: GET" -ForegroundColor Gray
Write-Host "Headers: $($headers | ConvertTo-Json)" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights" -Method GET -Headers $headers -Verbose
    Write-Host "✅ Rights API: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Rights API Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Error Details: $($_.Exception.Response)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Step 3: Test other APIs for comparison
Write-Host "`n3. Testing other APIs for comparison..." -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/applications" -Method GET -Headers $headers
    Write-Host "✅ Applications API: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Applications API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/accounts" -Method GET -Headers $headers
    Write-Host "✅ Accounts API: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Accounts API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nDebug test complete!" -ForegroundColor Green 