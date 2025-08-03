Write-Host "Testing Automated Rights Workflow for External Applications" -ForegroundColor Green

$baseUrl = "http://localhost:5000/api"

# Step 1: Login as admin to get token
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

# Step 2: Get existing user and application for testing
Write-Host "`n2. Getting existing user and application..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/users" -Method GET -Headers $headers
    $usersResponse = $response.Content | ConvertFrom-Json
    $testUser = $usersResponse.data[0]

    $response = Invoke-WebRequest -Uri "$baseUrl/v1/applications" -Method GET -Headers $headers
    $appsResponse = $response.Content | ConvertFrom-Json
    $testApp = $appsResponse.data[0]

    Write-Host "✅ Using User: $($testUser.username) (ID: $($testUser.id))" -ForegroundColor Green
    Write-Host "✅ Using Application: $($testApp.name) (ID: $($testApp.id))" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get test data: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Simulate APP-Y calling automated rights API
Write-Host "`n3. Simulating APP-Y calling automated rights API..." -ForegroundColor Green
Write-Host "   Scenario: User 'Sumit' registers in APP-Y, APP-Y calls admin backend" -ForegroundColor Gray

$automatedRightsData = @{
    userId = $testUser.id
    applicationId = $testApp.id
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/automated-rights/check-and-create" -Method POST -Body $automatedRightsData -Headers $headers
    $automatedResponse = $response.Content | ConvertFrom-Json
    
    if ($automatedResponse.success) {
        Write-Host "✅ Automated rights check successful:" -ForegroundColor Green
        Write-Host "   - Message: $($automatedResponse.message)" -ForegroundColor Gray
        Write-Host "   - Application: $($automatedResponse.data.applicationName)" -ForegroundColor Gray
        Write-Host "   - Account: $($automatedResponse.data.accountName)" -ForegroundColor Gray
        Write-Host "   - Permissions: $($automatedResponse.data.permissions -join ', ')" -ForegroundColor Gray
        Write-Host "   - Rights Code: $($automatedResponse.data.rightsCode.Substring(0, 50))..." -ForegroundColor Gray
        Write-Host "   - Status: $($automatedResponse.data.status)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Automated rights check failed: $($automatedResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Automated rights API call failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Check user permissions for the application
Write-Host "`n4. Checking user permissions for the application..." -ForegroundColor Green
$checkPermissionsData = @{
    userId = $testUser.id
    applicationId = $testApp.id
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/automated-rights/check-permissions" -Method POST -Body $checkPermissionsData -Headers $headers
    $permissionsResponse = $response.Content | ConvertFrom-Json
    
    if ($permissionsResponse.success) {
        Write-Host "✅ Permission check successful:" -ForegroundColor Green
        Write-Host "   - Has Access: $($permissionsResponse.data.hasAccess)" -ForegroundColor Gray
        Write-Host "   - Permissions: $($permissionsResponse.data.permissions -join ', ')" -ForegroundColor Gray
        Write-Host "   - Status: $($permissionsResponse.data.status)" -ForegroundColor Gray
        Write-Host "   - Message: $($permissionsResponse.data.message)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Permission check failed: $($permissionsResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Permission check API call failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Update permissions (simulate admin granting permissions)
Write-Host "`n5. Updating permissions (simulate admin granting permissions)..." -ForegroundColor Green
$updatePermissionsData = @{
    userId = $testUser.id
    applicationId = $testApp.id
    permissions = @("read", "write")
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/automated-rights/update-permissions" -Method PUT -Body $updatePermissionsData -Headers $headers
    $updateResponse = $response.Content | ConvertFrom-Json
    
    if ($updateResponse.success) {
        Write-Host "✅ Permissions updated successfully:" -ForegroundColor Green
        Write-Host "   - New Permissions: $($updateResponse.data.permissions -join ', ')" -ForegroundColor Gray
        Write-Host "   - Rights Code: $($updateResponse.data.rightsCode.Substring(0, 50))..." -ForegroundColor Gray
        Write-Host "   - Message: $($updateResponse.data.message)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Permission update failed: $($updateResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Permission update API call failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: Check permissions again after update
Write-Host "`n6. Checking permissions again after update..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/automated-rights/check-permissions" -Method POST -Body $checkPermissionsData -Headers $headers
    $permissionsResponse2 = $response.Content | ConvertFrom-Json
    
    if ($permissionsResponse2.success) {
        Write-Host "✅ Updated permission check:" -ForegroundColor Green
        Write-Host "   - Has Access: $($permissionsResponse2.data.hasAccess)" -ForegroundColor Gray
        Write-Host "   - Permissions: $($permissionsResponse2.data.permissions -join ', ')" -ForegroundColor Gray
        Write-Host "   - Status: $($permissionsResponse2.data.status)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Updated permission check failed: $($permissionsResponse2.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Updated permission check API call failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 7: Get all applications for the user
Write-Host "`n7. Getting all applications for the user..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/automated-rights/user/$($testUser.id)/applications" -Method GET -Headers $headers
    $applicationsResponse = $response.Content | ConvertFrom-Json
    
    if ($applicationsResponse.success) {
        Write-Host "✅ User applications retrieved:" -ForegroundColor Green
        Write-Host "   - Total Applications: $($applicationsResponse.data.Count)" -ForegroundColor Gray
        Write-Host "   - Message: $($applicationsResponse.message)" -ForegroundColor Gray
        
        foreach ($app in $applicationsResponse.data) {
            Write-Host "     - $($app.applicationName): $($app.permissions -join ', ') ($($app.status))" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Failed to get user applications: $($applicationsResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Get user applications API call failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Automated Rights Workflow Test Completed!" -ForegroundColor Green
Write-Host "`nSummary of the automated workflow:" -ForegroundColor Cyan
Write-Host "1. User registers in external application (APP-Y)" -ForegroundColor White
Write-Host "2. APP-Y calls admin backend with userId and applicationId" -ForegroundColor White
Write-Host "3. Admin backend checks if rights exist for user-application combination" -ForegroundColor White
Write-Host "4. If rights exist: Return existing rights code and permissions" -ForegroundColor White
Write-Host "5. If rights don't exist: Create new rights with empty permissions" -ForegroundColor White
Write-Host "6. Return rights code to external application" -ForegroundColor White
Write-Host "7. External application can check/update permissions as needed" -ForegroundColor White
Write-Host "8. Admin can later grant specific permissions through admin panel" -ForegroundColor White 