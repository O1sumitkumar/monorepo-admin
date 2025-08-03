# Test V1 APIs - Admin Panel Authentication
# This script tests all APIs using V1 JWT authentication

$baseUrl = "http://localhost:5000/api"
$adminToken = ""
$testResults = @()

Write-Host "🚀 Starting V1 API Tests..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

# Function to make authenticated requests
function Invoke-AuthenticatedRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Description
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($adminToken) {
        $headers["Authorization"] = "Bearer $adminToken"
    }
    
    $uri = "$baseUrl$Endpoint"
    
    try {
        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $jsonBody
        } else {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers
        }
        
        $result = @{
            Success = $true
            Description = $Description
            Status = "✅ PASS"
            Response = $response
        }
    } catch {
        $result = @{
            Success = $false
            Description = $Description
            Status = "❌ FAIL"
            Error = $_.Exception.Message
            StatusCode = $_.Exception.Response.StatusCode.value__
        }
    }
    
    $testResults += $result
    Write-Host "$($result.Status) - $Description" -ForegroundColor $(if ($result.Success) { "Green" } else { "Red" })
    
    return $result
}

# Step 1: Login to get admin token
Write-Host "`n🔐 Step 1: Admin Login" -ForegroundColor Yellow
$loginBody = @{
    username = "admin"
    password = "admin123"
}

$loginResult = Invoke-AuthenticatedRequest -Method "POST" -Endpoint "/auth/login" -Body $loginBody -Description "Admin Login"

if ($loginResult.Success) {
    $adminToken = $loginResult.Response.data.token
    Write-Host "✅ Admin token obtained: $($adminToken.Substring(0, 20))..." -ForegroundColor Green
} else {
    Write-Host "❌ Failed to get admin token. Stopping tests." -ForegroundColor Red
    exit 1
}

# Step 2: Test Auth APIs
Write-Host "`n🔐 Step 2: Testing Auth APIs" -ForegroundColor Yellow

Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/auth/profile" -Description "Get User Profile"
Invoke-AuthenticatedRequest -Method "POST" -Endpoint "/auth/verify" -Body @{ token = $adminToken } -Description "Verify Token"

# Step 3: Test Applications APIs
Write-Host "`n📱 Step 3: Testing Applications APIs" -ForegroundColor Yellow

Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/applications" -Description "Get All Applications"
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/applications?page=1&limit=5" -Description "Get Applications with Pagination"

# Create a test application
$newAppBody = @{
    name = "Test App V1"
    applicationId = "test-app-v1"
    description = "Test application for V1 API testing"
    status = "active"
}

$createAppResult = Invoke-AuthenticatedRequest -Method "POST" -Endpoint "/applications" -Body $newAppBody -Description "Create Test Application"

if ($createAppResult.Success) {
    $testAppId = $createAppResult.Response.data._id
    Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/applications/$testAppId" -Description "Get Application by ID"
    Invoke-AuthenticatedRequest -Method "PUT" -Endpoint "/applications/$testAppId" -Body @{ status = "inactive" } -Description "Update Application Status"
}

# Step 4: Test Accounts APIs
Write-Host "`n👤 Step 4: Testing Accounts APIs" -ForegroundColor Yellow

Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/accounts" -Description "Get All Accounts"
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/accounts?page=1&limit=5" -Description "Get Accounts with Pagination"

# Create a test account
$newAccountBody = @{
    name = "Test Account V1"
    accountId = "test-account-v1"
    email = "test@example.com"
    description = "Test account for V1 API testing"
    accountType = "Personal"
    status = "active"
}

$createAccountResult = Invoke-AuthenticatedRequest -Method "POST" -Endpoint "/accounts" -Body $newAccountBody -Description "Create Test Account"

if ($createAccountResult.Success) {
    $testAccountId = $createAccountResult.Response.data._id
    Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/accounts/$testAccountId" -Description "Get Account by ID"
    Invoke-AuthenticatedRequest -Method "PUT" -Endpoint "/accounts/$testAccountId" -Body @{ status = "inactive" } -Description "Update Account Status"
}

# Step 5: Test Users APIs
Write-Host "`n👥 Step 5: Testing Users APIs" -ForegroundColor Yellow

Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/users" -Description "Get All Users"
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/users?page=1&limit=5" -Description "Get Users with Pagination"

# Create a test user
$newUserBody = @{
    username = "testuser-v1"
    email = "testuser@example.com"
    password = "TestPass123!"
    role = "user"
}

$createUserResult = Invoke-AuthenticatedRequest -Method "POST" -Endpoint "/users" -Body $newUserBody -Description "Create Test User"

if ($createUserResult.Success) {
    $testUserId = $createUserResult.Response.data._id
    Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/users/$testUserId" -Description "Get User by ID"
    Invoke-AuthenticatedRequest -Method "PUT" -Endpoint "/users/$testUserId" -Body @{ status = "inactive" } -Description "Update User Status"
}

# Step 6: Test Rights APIs
Write-Host "`n🔐 Step 6: Testing Rights APIs" -ForegroundColor Yellow

Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/rights" -Description "Get All Rights"
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/rights?page=1&limit=5" -Description "Get Rights with Pagination"

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
    
    $createRightsResult = Invoke-AuthenticatedRequest -Method "POST" -Endpoint "/rights" -Body $newRightsBody -Description "Create Test Rights"
    
    if ($createRightsResult.Success) {
        $testRightsId = $createRightsResult.Response.data._id
        Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/rights/$testRightsId" -Description "Get Rights by ID"
        Invoke-AuthenticatedRequest -Method "PUT" -Endpoint "/rights/$testRightsId" -Body @{ permissions = @("read", "write", "admin") } -Description "Update Rights Permissions"
    }
}

# Step 7: Test Account Sharing APIs
Write-Host "`n🤝 Step 7: Testing Account Sharing APIs" -ForegroundColor Yellow

Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/account-sharing" -Description "Get All Account Sharing"
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/account-sharing?page=1&limit=5" -Description "Get Account Sharing with Pagination"

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
    
    $createSharingResult = Invoke-AuthenticatedRequest -Method "POST" -Endpoint "/account-sharing" -Body $newSharingBody -Description "Create Test Account Sharing"
    
    if ($createSharingResult.Success) {
        $testSharingId = $createSharingResult.Response.data._id
        Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/account-sharing/$testSharingId" -Description "Get Account Sharing by ID"
        Invoke-AuthenticatedRequest -Method "PUT" -Endpoint "/account-sharing/$testSharingId" -Body @{ permissions = @("read", "write") } -Description "Update Account Sharing Permissions"
    }
}

# Step 8: Test Automated Rights APIs (V1 Legacy)
Write-Host "`n🤖 Step 8: Testing Automated Rights APIs (V1 Legacy)" -ForegroundColor Yellow

# Get first user for automated rights testing
$usersResponse = Invoke-RestMethod -Uri "$baseUrl/users" -Method "GET" -Headers @{ "Authorization" = "Bearer $adminToken" }

if ($usersResponse.success -and $usersResponse.data.Count -gt 0 -and $appsResponse.success -and $appsResponse.data.Count -gt 0) {
    $firstUserId = $usersResponse.data[0]._id
    $firstAppId = $appsResponse.data[0]._id
    
    Invoke-AuthenticatedRequest -Method "POST" -Endpoint "/automated-rights/check-and-create" -Body @{
        userId = $firstUserId
        applicationId = $firstAppId
    } -Description "Check and Create Rights (V1)"
    
    Invoke-AuthenticatedRequest -Method "POST" -Endpoint "/automated-rights/check-permissions" -Body @{
        userId = $firstUserId
        applicationId = $firstAppId
    } -Description "Check User Permissions (V1)"
    
    Invoke-AuthenticatedRequest -Method "PUT" -Endpoint "/automated-rights/update-permissions" -Body @{
        userId = $firstUserId
        applicationId = $firstAppId
        permissions = @("read", "write", "admin")
    } -Description "Update Permissions (V1)"
    
    Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/automated-rights/user/applications" -Description "Get User Applications (V1)"
}

# Step 9: Test Health Check
Write-Host "`n🏥 Step 9: Testing Health Check" -ForegroundColor Yellow
Invoke-AuthenticatedRequest -Method "GET" -Endpoint "/health" -Description "Health Check"

# Summary
Write-Host "`n📊 Test Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Success }).Count
$failed = ($testResults | Where-Object { -not $_.Success }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($passed / $total) * 100, 2))%" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })

if ($failed -gt 0) {
    Write-Host "`n❌ Failed Tests:" -ForegroundColor Red
    $testResults | Where-Object { -not $_.Success } | ForEach-Object {
        Write-Host "  - $($_.Description): $($_.Error)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 V1 API Testing Complete!" -ForegroundColor Green 