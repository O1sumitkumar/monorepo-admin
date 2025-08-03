# Comprehensive V1 API Test Script
$baseUrl = "http://localhost:5000/api"
$adminToken = ""
$testResults = @()

Write-Host "🚀 Starting Comprehensive V1 API Tests..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

# Function to test an endpoint
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Description,
        [hashtable]$Headers = @{}
    )
    
    try {
        $uri = "$baseUrl$Endpoint"
        $requestHeaders = @{
            "Content-Type" = "application/json"
        }
        
        # Add authorization header if token exists
        if ($adminToken) {
            $requestHeaders["Authorization"] = "Bearer $adminToken"
        }
        
        # Add custom headers
        foreach ($key in $Headers.Keys) {
            $requestHeaders[$key] = $Headers[$key]
        }
        
        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $requestHeaders -Body $jsonBody
        } else {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $requestHeaders
        }
        
        Write-Host "✅ $Description - PASS" -ForegroundColor Green
        return @{ Success = $true; Response = $response }
    } catch {
        Write-Host "❌ $Description - FAIL: $($_.Exception.Message)" -ForegroundColor Red
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# Step 1: Test Health Check
Write-Host "`n🏥 Step 1: Health Check" -ForegroundColor Yellow
$healthResult = Test-Endpoint -Method "GET" -Endpoint "/health" -Description "Health Check"

# Step 2: Login
Write-Host "`n🔐 Step 2: Admin Login" -ForegroundColor Yellow
$loginBody = @{
    username = "admin"
    password = "admin123"
}

$loginResult = Test-Endpoint -Method "POST" -Endpoint "/auth/login" -Body $loginBody -Description "Admin Login"

if ($loginResult.Success) {
    $adminToken = $loginResult.Response.data.token
    Write-Host "✅ Admin token obtained: $($adminToken.Substring(0, 20))..." -ForegroundColor Green
} else {
    Write-Host "❌ Failed to get admin token. Stopping tests." -ForegroundColor Red
    exit 1
}

# Step 3: Test Auth APIs
Write-Host "`n🔐 Step 3: Testing Auth APIs" -ForegroundColor Yellow

Test-Endpoint -Method "GET" -Endpoint "/auth/profile" -Description "Get User Profile"
Test-Endpoint -Method "POST" -Endpoint "/auth/verify" -Body @{ token = $adminToken } -Description "Verify Token"

# Step 4: Test Applications APIs
Write-Host "`n📱 Step 4: Testing Applications APIs" -ForegroundColor Yellow

Test-Endpoint -Method "GET" -Endpoint "/applications" -Description "Get All Applications"

# Create test application
$newAppBody = @{
    name = "Test App V1"
    applicationId = "test-app-v1"
    description = "Test application for V1 API testing"
    status = "active"
}

$createAppResult = Test-Endpoint -Method "POST" -Endpoint "/applications" -Body $newAppBody -Description "Create Test Application"

if ($createAppResult.Success) {
    $testAppId = $createAppResult.Response.data._id
    Test-Endpoint -Method "GET" -Endpoint "/applications/$testAppId" -Description "Get Application by ID"
    Test-Endpoint -Method "PUT" -Endpoint "/applications/$testAppId" -Body @{ status = "inactive" } -Description "Update Application Status"
}

# Step 5: Test Accounts APIs
Write-Host "`n👤 Step 5: Testing Accounts APIs" -ForegroundColor Yellow

Test-Endpoint -Method "GET" -Endpoint "/accounts" -Description "Get All Accounts"

# Create test account
$newAccountBody = @{
    name = "Test Account V1"
    accountId = "test-account-v1"
    email = "test@example.com"
    description = "Test account for V1 API testing"
    accountType = "Personal"
    status = "active"
}

$createAccountResult = Test-Endpoint -Method "POST" -Endpoint "/accounts" -Body $newAccountBody -Description "Create Test Account"

if ($createAccountResult.Success) {
    $testAccountId = $createAccountResult.Response.data._id
    Test-Endpoint -Method "GET" -Endpoint "/accounts/$testAccountId" -Description "Get Account by ID"
    Test-Endpoint -Method "PUT" -Endpoint "/accounts/$testAccountId" -Body @{ status = "inactive" } -Description "Update Account Status"
}

# Step 6: Test Users APIs
Write-Host "`n👥 Step 6: Testing Users APIs" -ForegroundColor Yellow

Test-Endpoint -Method "GET" -Endpoint "/users" -Description "Get All Users"

# Create test user
$newUserBody = @{
    username = "testuser-v1"
    email = "testuser@example.com"
    password = "TestPass123!"
    role = "user"
}

$createUserResult = Test-Endpoint -Method "POST" -Endpoint "/users" -Body $newUserBody -Description "Create Test User"

if ($createUserResult.Success) {
    $testUserId = $createUserResult.Response.data._id
    Test-Endpoint -Method "GET" -Endpoint "/users/$testUserId" -Description "Get User by ID"
    Test-Endpoint -Method "PUT" -Endpoint "/users/$testUserId" -Body @{ status = "inactive" } -Description "Update User Status"
}

# Step 7: Test Rights APIs
Write-Host "`n🔐 Step 7: Testing Rights APIs" -ForegroundColor Yellow

Test-Endpoint -Method "GET" -Endpoint "/rights" -Description "Get All Rights"

# Get first application and account for rights testing
$appsResponse = Invoke-RestMethod -Uri "$baseUrl/applications" -Method "GET" -Headers @{ "Authorization" = "Bearer $adminToken" }
$accountsResponse = Invoke-RestMethod -Uri "$baseUrl/accounts" -Method "GET" -Headers @{ "Authorization" = "Bearer $adminToken" }

if ($appsResponse.success -and $accountsResponse.success -and $appsResponse.data.Count -gt 0 -and $accountsResponse.data.Count -gt 0) {
    $firstAppId = $appsResponse.data[0]._id
    $firstAccountId = $accountsResponse.data[0]._id
    
    # Create test rights
    $newRightsBody = @{
        applicationId = $firstAppId
        accountId = $firstAccountId
        permissions = @("read", "write")
        status = "active"
    }
    
    $createRightsResult = Test-Endpoint -Method "POST" -Endpoint "/rights" -Body $newRightsBody -Description "Create Test Rights"
    
    if ($createRightsResult.Success) {
        $testRightsId = $createRightsResult.Response.data._id
        Test-Endpoint -Method "GET" -Endpoint "/rights/$testRightsId" -Description "Get Rights by ID"
        Test-Endpoint -Method "PUT" -Endpoint "/rights/$testRightsId" -Body @{ permissions = @("read", "write", "admin") } -Description "Update Rights Permissions"
    }
}

# Step 8: Test Account Sharing APIs
Write-Host "`n🤝 Step 8: Testing Account Sharing APIs" -ForegroundColor Yellow

Test-Endpoint -Method "GET" -Endpoint "/account-sharing" -Description "Get All Account Sharing"

# Create test account sharing if we have accounts
if ($accountsResponse.success -and $accountsResponse.data.Count -gt 1) {
    $firstAccountId = $accountsResponse.data[0]._id
    $secondAccountId = $accountsResponse.data[1]._id
    
    $newSharingBody = @{
        sourceAccountId = $firstAccountId
        targetAccountId = $secondAccountId
        permissions = @("read")
        status = "active"
        description = "Test account sharing for V1 API"
    }
    
    $createSharingResult = Test-Endpoint -Method "POST" -Endpoint "/account-sharing" -Body $newSharingBody -Description "Create Test Account Sharing"
    
    if ($createSharingResult.Success) {
        $testSharingId = $createSharingResult.Response.data._id
        Test-Endpoint -Method "GET" -Endpoint "/account-sharing/$testSharingId" -Description "Get Account Sharing by ID"
        Test-Endpoint -Method "PUT" -Endpoint "/account-sharing/$testSharingId" -Body @{ permissions = @("read", "write") } -Description "Update Account Sharing Permissions"
    }
}

# Step 9: Test Automated Rights APIs (V1 Legacy)
Write-Host "`n🤖 Step 9: Testing Automated Rights APIs (V1 Legacy)" -ForegroundColor Yellow

# Get first user for automated rights testing
$usersResponse = Invoke-RestMethod -Uri "$baseUrl/users" -Method "GET" -Headers @{ "Authorization" = "Bearer $adminToken" }

if ($usersResponse.success -and $usersResponse.data.Count -gt 0 -and $appsResponse.success -and $appsResponse.data.Count -gt 0) {
    $firstUserId = $usersResponse.data[0]._id
    $firstAppId = $appsResponse.data[0]._id
    
    Test-Endpoint -Method "POST" -Endpoint "/automated-rights/check-and-create" -Body @{
        userId = $firstUserId
        applicationId = $firstAppId
    } -Description "Check and Create Rights (V1)"
    
    Test-Endpoint -Method "POST" -Endpoint "/automated-rights/check-permissions" -Body @{
        userId = $firstUserId
        applicationId = $firstAppId
    } -Description "Check User Permissions (V1)"
    
    Test-Endpoint -Method "PUT" -Endpoint "/automated-rights/update-permissions" -Body @{
        userId = $firstUserId
        applicationId = $firstAppId
        permissions = @("read", "write", "admin")
    } -Description "Update Permissions (V1)"
    
    Test-Endpoint -Method "GET" -Endpoint "/automated-rights/user/applications" -Description "Get User Applications (V1)"
}

Write-Host "`n🎉 V1 API Testing Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "All tests have been executed. Check the results above." -ForegroundColor White 