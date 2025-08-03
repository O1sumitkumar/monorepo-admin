# Comprehensive CRUD and Database Relations Test
Write-Host "Starting Comprehensive CRUD and Database Relations Test..." -ForegroundColor Green

$baseUrl = "http://localhost:5000/api"

# Get authentication token
Write-Host "`n1. Authentication Test..." -ForegroundColor Yellow
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/v1/auth/login" -Method POST -Body $loginData -ContentType "application/json"
$loginResponse = $response.Content | ConvertFrom-Json
$token = $loginResponse.data.token
Write-Host "Authentication: SUCCESS" -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $token"
}

# Test 2: Applications CRUD
Write-Host "`n2. Applications CRUD Test..." -ForegroundColor Yellow

# Get all applications
$response = Invoke-WebRequest -Uri "$baseUrl/v1/applications" -Method GET -Headers $headers
$appsResponse = $response.Content | ConvertFrom-Json
Write-Host "GET Applications: SUCCESS ($($appsResponse.data.Count) found)" -ForegroundColor Green

# Create new application
$newApp = @{
    name = "Test App"
    applicationId = "test-app-$(Get-Date -Format 'yyyyMMddHHmmss')"
    description = "Test application for CRUD testing"
    status = "active"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/v1/applications" -Method POST -Body $newApp -Headers $headers -ContentType "application/json"
$createResponse = $response.Content | ConvertFrom-Json
$newAppId = $createResponse.data.id
Write-Host "CREATE Application: SUCCESS (ID: $newAppId)" -ForegroundColor Green

# Update application
$updateApp = @{
    name = "Updated Test App"
    description = "Updated test application"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/v1/applications/$newAppId" -Method PUT -Body $updateApp -Headers $headers -ContentType "application/json"
Write-Host "UPDATE Application: SUCCESS" -ForegroundColor Green

# Delete application
$response = Invoke-WebRequest -Uri "$baseUrl/v1/applications/$newAppId" -Method DELETE -Headers $headers
Write-Host "DELETE Application: SUCCESS" -ForegroundColor Green

# Test 3: Accounts CRUD
Write-Host "`n3. Accounts CRUD Test..." -ForegroundColor Yellow

# Get all accounts
$response = Invoke-WebRequest -Uri "$baseUrl/v1/accounts" -Method GET -Headers $headers
$accountsResponse = $response.Content | ConvertFrom-Json
Write-Host "GET Accounts: SUCCESS ($($accountsResponse.data.Count) found)" -ForegroundColor Green

# Create new account
$newAccount = @{
    name = "Test Account"
    accountId = "test-account-$(Get-Date -Format 'yyyyMMddHHmmss')"
    email = "test@example.com"
    description = "Test account for CRUD testing"
    accountType = "individual"
    status = "active"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/v1/accounts" -Method POST -Body $newAccount -Headers $headers -ContentType "application/json"
$createAccountResponse = $response.Content | ConvertFrom-Json
$newAccountId = $createAccountResponse.data.id
Write-Host "CREATE Account: SUCCESS (ID: $newAccountId)" -ForegroundColor Green

# Update account
$updateAccount = @{
    name = "Updated Test Account"
    description = "Updated test account"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/v1/accounts/$newAccountId" -Method PUT -Body $updateAccount -Headers $headers -ContentType "application/json"
Write-Host "UPDATE Account: SUCCESS" -ForegroundColor Green

# Test 4: Users CRUD
Write-Host "`n4. Users CRUD Test..." -ForegroundColor Yellow

# Get all users
$response = Invoke-WebRequest -Uri "$baseUrl/v1/users" -Method GET -Headers $headers
$usersResponse = $response.Content | ConvertFrom-Json
Write-Host "GET Users: SUCCESS ($($usersResponse.data.Count) found)" -ForegroundColor Green

# Create new user
$newUser = @{
    username = "testuser$(Get-Date -Format 'yyyyMMddHHmmss')"
    email = "testuser@example.com"
    password = "TestPass123"
    role = "user"
    status = "active"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/v1/users" -Method POST -Body $newUser -Headers $headers -ContentType "application/json"
$createUserResponse = $response.Content | ConvertFrom-Json
$newUserId = $createUserResponse.data.id
Write-Host "CREATE User: SUCCESS (ID: $newUserId)" -ForegroundColor Green

# Test 5: Rights CRUD and Database Relations
Write-Host "`n5. Rights CRUD and Database Relations Test..." -ForegroundColor Yellow

# Get existing applications and accounts for rights creation
$response = Invoke-WebRequest -Uri "$baseUrl/v1/applications" -Method GET -Headers $headers
$appsResponse = $response.Content | ConvertFrom-Json
$appId = $appsResponse.data[0].id

$response = Invoke-WebRequest -Uri "$baseUrl/v1/accounts" -Method GET -Headers $headers
$accountsResponse = $response.Content | ConvertFrom-Json
$accountId = $accountsResponse.data[0].id

Write-Host "Using Application ID: $appId" -ForegroundColor Gray
Write-Host "Using Account ID: $accountId" -ForegroundColor Gray

# Create new rights
$newRights = @{
    applicationId = $appId
    accountId = $accountId
    permissions = @("read", "write")
    expiresAt = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json

Write-Host "Creating rights with data: $newRights" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights" -Method POST -Body $newRights -Headers $headers -ContentType "application/json"
    $createRightsResponse = $response.Content | ConvertFrom-Json
    $newRightsId = $createRightsResponse.data.id
    Write-Host "CREATE Rights: SUCCESS (ID: $newRightsId)" -ForegroundColor Green
} catch {
    Write-Host "CREATE Rights FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

# Test 6: Database Relations Verification
Write-Host "`n6. Database Relations Verification..." -ForegroundColor Yellow

# Test App-X Integration
Write-Host "Testing App-X Integration..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/app-x/health" -Method GET
    Write-Host "App-X Health: SUCCESS" -ForegroundColor Green
} catch {
    Write-Host "App-X Health: FAILED" -ForegroundColor Red
}

# Test Rights Verification
Write-Host "Testing Rights Verification..." -ForegroundColor Cyan
try {
    $verifyData = @{
        applicationId = $appId
        accountId = $accountId
        permissions = @("read")
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights/verify" -Method POST -Body $verifyData -Headers $headers -ContentType "application/json"
    Write-Host "Rights Verification: SUCCESS" -ForegroundColor Green
} catch {
    Write-Host "Rights Verification: FAILED" -ForegroundColor Red
}

Write-Host "`nComprehensive Test Complete!" -ForegroundColor Green 