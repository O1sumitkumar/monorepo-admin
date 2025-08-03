# Test API Versions
Write-Host "🧪 Testing API Versions..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

# Test V1 endpoints
Write-Host "`n🔐 Testing V1 API (JWT Authentication)" -ForegroundColor Yellow

try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/health" -Method "GET"
    Write-Host "✅ V1 Health Check - PASS" -ForegroundColor Green
} catch {
    Write-Host "❌ V1 Health Check - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $loginBody = @{
        username = "admin"
        password = "admin123"
    }
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method "POST" -Body ($loginBody | ConvertTo-Json) -ContentType "application/json"
    Write-Host "✅ V1 Login - PASS" -ForegroundColor Green
    Write-Host "   Token: $($loginResponse.data.token.Substring(0, 20))..." -ForegroundColor Yellow
} catch {
    Write-Host "❌ V1 Login - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Legacy endpoints
Write-Host "`n🔄 Testing Legacy API (Backward Compatibility)" -ForegroundColor Yellow

try {
    $legacyHealthResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method "GET"
    Write-Host "✅ Legacy Health Check - PASS" -ForegroundColor Green
} catch {
    Write-Host "❌ Legacy Health Check - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $legacyLoginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method "POST" -Body ($loginBody | ConvertTo-Json) -ContentType "application/json"
    Write-Host "✅ Legacy Login - PASS" -ForegroundColor Green
    Write-Host "   Token: $($legacyLoginResponse.data.token.Substring(0, 20))..." -ForegroundColor Yellow
} catch {
    Write-Host "❌ Legacy Login - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test authenticated endpoints with V1 token
Write-Host "`n🔐 Testing V1 Authenticated Endpoints" -ForegroundColor Yellow

if ($loginResponse.data.token) {
    $headers = @{
        "Authorization" = "Bearer $($loginResponse.data.token)"
        "Content-Type" = "application/json"
    }
    
    try {
        $profileResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/profile" -Method "GET" -Headers $headers
        Write-Host "✅ V1 Profile - PASS" -ForegroundColor Green
        Write-Host "   User: $($profileResponse.data.user.username)" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ V1 Profile - FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    try {
        $appsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/applications" -Method "GET" -Headers $headers
        Write-Host "✅ V1 Applications - PASS" -ForegroundColor Green
        Write-Host "   Count: $($appsResponse.data.Count)" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ V1 Applications - FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    try {
        $rightsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/rights" -Method "GET" -Headers $headers
        Write-Host "✅ V1 Rights - PASS" -ForegroundColor Green
        Write-Host "   Count: $($rightsResponse.data.Count)" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ V1 Rights - FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test authenticated endpoints with Legacy token
Write-Host "`n🔄 Testing Legacy Authenticated Endpoints" -ForegroundColor Yellow

if ($legacyLoginResponse.data.token) {
    $legacyHeaders = @{
        "Authorization" = "Bearer $($legacyLoginResponse.data.token)"
        "Content-Type" = "application/json"
    }
    
    try {
        $legacyProfileResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/profile" -Method "GET" -Headers $legacyHeaders
        Write-Host "✅ Legacy Profile - PASS" -ForegroundColor Green
        Write-Host "   User: $($legacyProfileResponse.data.user.username)" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Legacy Profile - FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    try {
        $legacyAppsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/applications" -Method "GET" -Headers $legacyHeaders
        Write-Host "✅ Legacy Applications - PASS" -ForegroundColor Green
        Write-Host "   Count: $($legacyAppsResponse.data.Count)" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Legacy Applications - FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 API Version Testing Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ V1 API: http://localhost:5000/api/v1" -ForegroundColor Green
Write-Host "✅ Legacy API: http://localhost:5000/api" -ForegroundColor Green
Write-Host "✅ Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "2. Use the API Version Switcher component" -ForegroundColor White
Write-Host "3. Test different API versions" -ForegroundColor White
Write-Host "4. Check browser console for API logs" -ForegroundColor White 