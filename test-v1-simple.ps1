# Simple V1 API Test Script
$baseUrl = "http://localhost:5000/api"
$adminToken = ""

Write-Host "🚀 Starting V1 API Tests..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

# Step 1: Login
Write-Host "`n🔐 Step 1: Admin Login" -ForegroundColor Yellow
$loginBody = @{
    username = "admin"
    password = "admin123"
}

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method "POST" -Body ($loginBody | ConvertTo-Json) -ContentType "application/json"
    $adminToken = $loginResponse.data.token
    Write-Host "✅ Login successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Set headers for authenticated requests
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $adminToken"
}

# Step 2: Test Auth APIs
Write-Host "`n🔐 Step 2: Testing Auth APIs" -ForegroundColor Yellow

try {
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/auth/profile" -Method "GET" -Headers $headers
    Write-Host "✅ Get Profile - PASS" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Profile - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $verifyBody = @{ token = $adminToken }
    $verifyResponse = Invoke-RestMethod -Uri "$baseUrl/auth/verify" -Method "POST" -Body ($verifyBody | ConvertTo-Json) -Headers $headers
    Write-Host "✅ Verify Token - PASS" -ForegroundColor Green
} catch {
    Write-Host "❌ Verify Token - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Test Applications APIs
Write-Host "`n📱 Step 3: Testing Applications APIs" -ForegroundColor Yellow

try {
    $appsResponse = Invoke-RestMethod -Uri "$baseUrl/applications" -Method "GET" -Headers $headers
    Write-Host "✅ Get All Applications - PASS" -ForegroundColor Green
} catch {
    Write-Host "❌ Get All Applications - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $appsPaginatedResponse = Invoke-RestMethod -Uri "$baseUrl/applications?page=1&limit=5" -Method "GET" -Headers $headers
    Write-Host "✅ Get Applications with Pagination - PASS" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Applications with Pagination - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Create test application
$newAppBody = @{
    name = "Test App V1"
    applicationId = "test-app-v1"
    description = "Test application for V1 API testing"
    status = "active"
}

try {
    $createAppResponse = Invoke-RestMethod -Uri "$baseUrl/applications" -Method "POST" -Body ($newAppBody | ConvertTo-Json) -Headers $headers
    Write-Host "✅ Create Application - PASS" -ForegroundColor Green
    $testAppId = $createAppResponse.data._id
} catch {
    Write-Host "❌ Create Application - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Test Accounts APIs
Write-Host "`n👤 Step 4: Testing Accounts APIs" -ForegroundColor Yellow

try {
    $accountsResponse = Invoke-RestMethod -Uri "$baseUrl/accounts" -Method "GET" -Headers $headers
    Write-Host "✅ Get All Accounts - PASS" -ForegroundColor Green
} catch {
    Write-Host "❌ Get All Accounts - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $accountsPaginatedResponse = Invoke-RestMethod -Uri "$baseUrl/accounts?page=1&limit=5" -Method "GET" -Headers $headers
    Write-Host "✅ Get Accounts with Pagination - PASS" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Accounts with Pagination - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Create test account
$newAccountBody = @{
    name = "Test Account V1"
    accountId = "test-account-v1"
    email = "test@example.com"
    description = "Test account for V1 API testing"
    accountType = "Personal"
    status = "active"
}

try {
    $createAccountResponse = Invoke-RestMethod -Uri "$baseUrl/accounts" -Method "POST" -Body ($newAccountBody | ConvertTo-Json) -Headers $headers
    Write-Host "✅ Create Account - PASS" -ForegroundColor Green
    $testAccountId = $createAccountResponse.data._id
} catch {
    Write-Host "❌ Create Account - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Test Users APIs
Write-Host "`n👥 Step 5: Testing Users APIs" -ForegroundColor Yellow

try {
    $usersResponse = Invoke-RestMethod -Uri "$baseUrl/users" -Method "GET" -Headers $headers
    Write-Host "✅ Get All Users - PASS" -ForegroundColor Green
} catch {
    Write-Host "❌ Get All Users - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $usersPaginatedResponse = Invoke-RestMethod -Uri "$baseUrl/users?page=1&limit=5" -Method "GET" -Headers $headers
    Write-Host "✅ Get Users with Pagination - PASS" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Users with Pagination - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Create test user
$newUserBody = @{
    username = "testuser-v1"
    email = "testuser@example.com"
    password = "TestPass123!"
    role = "user"
}

try {
    $createUserResponse = Invoke-RestMethod -Uri "$baseUrl/users" -Method "POST" -Body ($newUserBody | ConvertTo-Json) -Headers $headers
    Write-Host "✅ Create User - PASS" -ForegroundColor Green
    $testUserId = $createUserResponse.data._id
} catch {
    Write-Host "❌ Create User - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: Test Rights APIs
Write-Host "`n🔐 Step 6: Testing Rights APIs" -ForegroundColor Yellow

try {
    $rightsResponse = Invoke-RestMethod -Uri "$baseUrl/rights" -Method "GET" -Headers $headers
    Write-Host "✅ Get All Rights - PASS" -ForegroundColor Green
} catch {
    Write-Host "❌ Get All Rights - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $rightsPaginatedResponse = Invoke-RestMethod -Uri "$baseUrl/rights?page=1&limit=5" -Method "GET" -Headers $headers
    Write-Host "✅ Get Rights with Pagination - PASS" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Rights with Pagination - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 7: Test Account Sharing APIs
Write-Host "`n🤝 Step 7: Testing Account Sharing APIs" -ForegroundColor Yellow

try {
    $sharingResponse = Invoke-RestMethod -Uri "$baseUrl/account-sharing" -Method "GET" -Headers $headers
    Write-Host "✅ Get All Account Sharing - PASS" -ForegroundColor Green
} catch {
    Write-Host "❌ Get All Account Sharing - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $sharingPaginatedResponse = Invoke-RestMethod -Uri "$baseUrl/account-sharing?page=1&limit=5" -Method "GET" -Headers $headers
    Write-Host "✅ Get Account Sharing with Pagination - PASS" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Account Sharing with Pagination - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 8: Test Automated Rights APIs (V1 Legacy)
Write-Host "`n🤖 Step 8: Testing Automated Rights APIs (V1 Legacy)" -ForegroundColor Yellow

if ($usersResponse.success -and $usersResponse.data.Count -gt 0 -and $appsResponse.success -and $appsResponse.data.Count -gt 0) {
    $firstUserId = $usersResponse.data[0]._id
    $firstAppId = $appsResponse.data[0]._id
    
    try {
        $checkRightsBody = @{
            userId = $firstUserId
            applicationId = $firstAppId
        }
        $checkRightsResponse = Invoke-RestMethod -Uri "$baseUrl/automated-rights/check-and-create" -Method "POST" -Body ($checkRightsBody | ConvertTo-Json) -Headers $headers
        Write-Host "✅ Check and Create Rights (V1) - PASS" -ForegroundColor Green
    } catch {
        Write-Host "❌ Check and Create Rights (V1) - FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    try {
        $checkPermsBody = @{
            userId = $firstUserId
            applicationId = $firstAppId
        }
        $checkPermsResponse = Invoke-RestMethod -Uri "$baseUrl/automated-rights/check-permissions" -Method "POST" -Body ($checkPermsBody | ConvertTo-Json) -Headers $headers
        Write-Host "✅ Check User Permissions (V1) - PASS" -ForegroundColor Green
    } catch {
        Write-Host "❌ Check User Permissions (V1) - FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 9: Test Health Check
Write-Host "`n🏥 Step 9: Testing Health Check" -ForegroundColor Yellow

try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method "GET" -Headers $headers
    Write-Host "✅ Health Check - PASS" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 V1 API Testing Complete!" -ForegroundColor Green 