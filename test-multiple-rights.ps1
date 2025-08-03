Write-Host "Testing Multiple Rights for Same User" -ForegroundColor Green

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

# Step 2: Get existing applications and accounts
Write-Host "`n2. Getting existing applications and accounts..." -ForegroundColor Green
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/applications" -Method GET -Headers $headers
    $appsResponse = $response.Content | ConvertFrom-Json
    $app1 = $appsResponse.data[0]
    $app2 = $appsResponse.data[1]
    Write-Host "✅ Found applications: $($app1.name), $($app2.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get applications: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/accounts" -Method GET -Headers $headers
    $accountsResponse = $response.Content | ConvertFrom-Json
    $account = $accountsResponse.data[0]
    Write-Host "✅ Found account: $($account.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get accounts: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Create first rights record
Write-Host "`n3. Creating first rights record..." -ForegroundColor Green
$rights1 = @{
    applicationId = $app1.id
    accountId = $account.id
    permissions = @("read", "write")
    expiresAt = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights" -Method POST -Body $rights1 -Headers $headers
    $rights1Response = $response.Content | ConvertFrom-Json
    Write-Host "✅ First rights created: $($rights1Response.data.id)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create first rights: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Create second rights record for same user in different app
Write-Host "`n4. Creating second rights record for same user in different app..." -ForegroundColor Green
$rights2 = @{
    applicationId = $app2.id
    accountId = $account.id
    permissions = @("admin")
    expiresAt = (Get-Date).AddDays(60).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights" -Method POST -Body $rights2 -Headers $headers
    $rights2Response = $response.Content | ConvertFrom-Json
    Write-Host "✅ Second rights created: $($rights2Response.data.id)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create second rights: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 5: Verify both rights exist
Write-Host "`n5. Verifying both rights exist..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights" -Method GET -Headers $headers
    $rightsResponse = $response.Content | ConvertFrom-Json
    Write-Host "✅ Total rights found: $($rightsResponse.data.Count)" -ForegroundColor Green
    
    foreach ($right in $rightsResponse.data) {
        Write-Host "  - Rights ID: $($right.id), App: $($right.applicationName), Permissions: $($right.permissions -join ',')" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to get rights: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Test completed successfully!" -ForegroundColor Green 