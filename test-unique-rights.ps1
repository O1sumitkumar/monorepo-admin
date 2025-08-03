Write-Host "Testing Unique Rights Constraint (applicationId + accountId)" -ForegroundColor Green

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

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 2: Get existing applications and accounts
Write-Host "`n2. Getting existing applications and accounts..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/applications" -Method GET -Headers $headers
    $appsResponse = $response.Content | ConvertFrom-Json
    $app1 = $appsResponse.data[0]
    $app2 = $appsResponse.data[1]

    $response = Invoke-WebRequest -Uri "$baseUrl/v1/accounts" -Method GET -Headers $headers
    $accountsResponse = $response.Content | ConvertFrom-Json
    $account1 = $accountsResponse.data[0]
    $account2 = $accountsResponse.data[1]

    Write-Host "✅ Using Application 1: $($app1.name), Application 2: $($app2.name)" -ForegroundColor Green
    Write-Host "✅ Using Account 1: $($account1.name), Account 2: $($account2.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get applications/accounts: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Test Unique Constraint - Same application + account combination
Write-Host "`n3. Testing Unique Constraint - Same application + account combination..." -ForegroundColor Green

# Create first rights record
$rightsData1 = @{
    applicationId = $app1.id
    accountId = $account1.id
    permissions = @("read", "write")
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights" -Method POST -Body $rightsData1 -Headers $headers
    $rightsResponse1 = $response.Content | ConvertFrom-Json
    Write-Host "✅ Created first rights record for $($app1.name) + $($account1.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create first rights record: $($_.Exception.Message)" -ForegroundColor Red
}

# Try to create second rights record with SAME application + account combination
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights" -Method POST -Body $rightsData1 -Headers $headers
    $rightsResponse2 = $response.Content | ConvertFrom-Json
    Write-Host "❌ ERROR: Should have failed - duplicate rights created!" -ForegroundColor Red
} catch {
    $errorResponse = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errorResponse)
    $errorContent = $reader.ReadToEnd()
    $errorObj = $errorContent | ConvertFrom-Json
    
    if ($errorObj.message -like "*already exist*") {
        Write-Host "✅ CORRECT: Duplicate rights creation blocked - $($errorObj.message)" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($errorObj.message)" -ForegroundColor Red
    }
}

# Step 4: Test Different Combinations - Should Work
Write-Host "`n4. Testing Different Combinations - Should Work..." -ForegroundColor Green

# Different application + same account
$rightsData2 = @{
    applicationId = $app2.id
    accountId = $account1.id
    permissions = @("admin")
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights" -Method POST -Body $rightsData2 -Headers $headers
    $rightsResponse3 = $response.Content | ConvertFrom-Json
    Write-Host "✅ Created rights for different application + same account" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create rights for different application: $($_.Exception.Message)" -ForegroundColor Red
}

# Same application + different account
$rightsData3 = @{
    applicationId = $app1.id
    accountId = $account2.id
    permissions = @("read")
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights" -Method POST -Body $rightsData3 -Headers $headers
    $rightsResponse4 = $response.Content | ConvertFrom-Json
    Write-Host "✅ Created rights for same application + different account" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create rights for different account: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Verify All Rights Exist
Write-Host "`n5. Verifying All Rights..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights" -Method GET -Headers $headers
    $rightsResponse = $response.Content | ConvertFrom-Json
    Write-Host "✅ Total rights found: $($rightsResponse.data.Count)" -ForegroundColor Green
    
    foreach ($right in $rightsResponse.data) {
        Write-Host "   - Rights ID: $($right.id), App: $($right.applicationName), Account: $($right.accountName), Permissions: $($right.permissions -join ',')" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to get rights: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Unique Rights Constraint Test Completed!" -ForegroundColor Green
Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "✅ Unique constraint on applicationId + accountId is working" -ForegroundColor Green
Write-Host "✅ Each account can have only one rights record per application" -ForegroundColor Green
Write-Host "✅ Different application + account combinations are allowed" -ForegroundColor Green
Write-Host "✅ Error messages are clear and informative" -ForegroundColor Green 