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

# Step 2: New User Approaches Admin Panel
Write-Host "`n2. New User 'John Smith' approaches admin panel for permission..." -ForegroundColor Green
Write-Host "   - User wants access to APP-X application" -ForegroundColor Gray
Write-Host "   - User needs 'read' and 'write' permissions" -ForegroundColor Gray

# Step 3: Admin creates account for the new user
Write-Host "`n3. Admin creates account for new user..." -ForegroundColor Green
$newAccountData = @{
    name = "John Smith"
    email = "john.smith@example.com"
    description = "New user account for John Smith"
    accountType = "Personal"
    status = "active"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/accounts" -Method POST -Body $newAccountData -Headers $headers
    $accountResponse = $response.Content | ConvertFrom-Json
    $newAccount = $accountResponse.data
    Write-Host "✅ Created account for John Smith: $($newAccount.accountId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create account: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Admin creates user with account reference
Write-Host "`n4. Admin creates user with account reference..." -ForegroundColor Green
$newUserData = @{
    username = "johnsmith"
    email = "john.smith@example.com"
    password = "password123"
    role = "user"
    status = "active"
    accountId = $newAccount.id
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/users" -Method POST -Body $newUserData -Headers $headers
    $userResponse = $response.Content | ConvertFrom-Json
    $newUser = $userResponse.data
    Write-Host "✅ Created user 'johnsmith' with account reference" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create user: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 5: Admin gets available applications
Write-Host "`n5. Admin gets available applications..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/applications" -Method GET -Headers $headers
    $appsResponse = $response.Content | ConvertFrom-Json
    $appX = $appsResponse.data | Where-Object { $_.name -like "*APP-X*" } | Select-Object -First 1
    
    if (-not $appX) {
        Write-Host "⚠️ APP-X not found, using first available application" -ForegroundColor Yellow
        $appX = $appsResponse.data[0]
    }
    
    Write-Host "✅ Found target application: $($appX.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get applications: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 6: Admin creates rights for the new user
Write-Host "`n6. Admin creates rights for new user..." -ForegroundColor Green
$rightsData = @{
    applicationId = $appX.id
    accountId = $newAccount.id
    permissions = @("read", "write")
    expiresAt = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights" -Method POST -Body $rightsData -Headers $headers
    $rightsResponse = $response.Content | ConvertFrom-Json
    $newRights = $rightsResponse.data
    Write-Host "✅ Created rights for John Smith:" -ForegroundColor Green
    Write-Host "   - Application: $($newRights.applicationName)" -ForegroundColor Gray
    Write-Host "   - Account: $($newRights.accountName)" -ForegroundColor Gray
    Write-Host "   - Permissions: $($newRights.permissions -join ', ')" -ForegroundColor Gray
    Write-Host "   - Rights Code: $($newRights.rightsCode.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host "   - Expires: $($newRights.expiresAt)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to create rights: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 7: Verify the complete setup
Write-Host "`n7. Verifying complete setup..." -ForegroundColor Green
try {
    # Check user
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/users/$($newUser.id)" -Method GET -Headers $headers
    $userCheck = $response.Content | ConvertFrom-Json
    Write-Host "✅ User verification:" -ForegroundColor Green
    Write-Host "   - Username: $($userCheck.data.username)" -ForegroundColor Gray
    Write-Host "   - Account ID: $($userCheck.data.accountId)" -ForegroundColor Gray
    Write-Host "   - Role: $($userCheck.data.role)" -ForegroundColor Gray

    # Check account
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/accounts/$($newAccount.id)" -Method GET -Headers $headers
    $accountCheck = $response.Content | ConvertFrom-Json
    Write-Host "✅ Account verification:" -ForegroundColor Green
    Write-Host "   - Name: $($accountCheck.data.name)" -ForegroundColor Gray
    Write-Host "   - Type: $($accountCheck.data.accountType)" -ForegroundColor Gray
    Write-Host "   - Status: $($accountCheck.data.status)" -ForegroundColor Gray

    # Check rights
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights/$($newRights.id)" -Method GET -Headers $headers
    $rightsCheck = $response.Content | ConvertFrom-Json
    Write-Host "✅ Rights verification:" -ForegroundColor Green
    Write-Host "   - Application: $($rightsCheck.data.applicationName)" -ForegroundColor Gray
    Write-Host "   - Account: $($rightsCheck.data.accountName)" -ForegroundColor Gray
    Write-Host "   - Permissions: $($rightsCheck.data.permissions -join ', ')" -ForegroundColor Gray
    Write-Host "   - Status: $($rightsCheck.data.status)" -ForegroundColor Gray

} catch {
    Write-Host "❌ Verification failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 8: Test what happens if admin tries to create duplicate rights
Write-Host "`n8. Testing duplicate rights prevention..." -ForegroundColor Green
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

Write-Host "`n✅ New User Permission Flow Test Completed!" -ForegroundColor Green
Write-Host "`nSummary of the workflow:" -ForegroundColor Cyan
Write-Host "1. New user approaches admin panel for permission" -ForegroundColor White
Write-Host "2. Admin creates account for the user" -ForegroundColor White
Write-Host "3. Admin creates user with account reference" -ForegroundColor White
Write-Host "4. Admin selects target application" -ForegroundColor White
Write-Host "5. Admin creates rights (applicationId + accountId combination)" -ForegroundColor White
Write-Host "6. System generates JWT rights code" -ForegroundColor White
Write-Host "7. User can now access the application with specified permissions" -ForegroundColor White
Write-Host "8. Unique constraint prevents duplicate rights" -ForegroundColor White 