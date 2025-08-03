Write-Host "Testing New User Permission Flow" -ForegroundColor Green

$baseUrl = "http://localhost:5000/api"

# Step 1: Login as admin
Write-Host "`n1. Admin Login..." -ForegroundColor Green
try {
    $loginData = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/v1/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $loginResponse = $response.Content | ConvertFrom-Json
    
    if ($loginResponse.success) {
        $token = $loginResponse.data.token
        Write-Host "✅ Admin login successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Admin login failed: $($loginResponse.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Admin login request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 2: Get existing data
Write-Host "`n2. Getting existing applications and accounts..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/applications" -Method GET -Headers $headers
    $appsResponse = $response.Content | ConvertFrom-Json
    $app = $appsResponse.data[0]

    $response = Invoke-WebRequest -Uri "$baseUrl/v1/accounts" -Method GET -Headers $headers
    $accountsResponse = $response.Content | ConvertFrom-Json
    $account = $accountsResponse.data[0]

    Write-Host "✅ Using Application: $($app.name)" -ForegroundColor Green
    Write-Host "✅ Using Account: $($account.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get data: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Create rights for existing account
Write-Host "`n3. Creating rights for existing account..." -ForegroundColor Green
$rightsData = @{
    applicationId = $app.id
    accountId = $account.id
    permissions = @("read", "write")
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights" -Method POST -Body $rightsData -Headers $headers
    $rightsResponse = $response.Content | ConvertFrom-Json
    Write-Host "✅ Created rights successfully:" -ForegroundColor Green
    Write-Host "   - Application: $($rightsResponse.data.applicationName)" -ForegroundColor Gray
    Write-Host "   - Account: $($rightsResponse.data.accountName)" -ForegroundColor Gray
    Write-Host "   - Permissions: $($rightsResponse.data.permissions -join ', ')" -ForegroundColor Gray
    Write-Host "   - Rights Code: $($rightsResponse.data.rightsCode.Substring(0, 50))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to create rights: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Try to create duplicate rights
Write-Host "`n4. Testing duplicate rights prevention..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights" -Method POST -Body $rightsData -Headers $headers
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

Write-Host "`n✅ Test completed!" -ForegroundColor Green 