# Test Frontend V1 Authentication
Write-Host "🧪 Testing Frontend V1 Authentication..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

# Test if frontend is running
try {
    $frontendResponse = Invoke-RestMethod -Uri "http://localhost:5173" -Method "GET" -TimeoutSec 5
    Write-Host "✅ Frontend is running on http://localhost:5173" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend is not running. Please start it with: cd client && npm run dev" -ForegroundColor Red
    exit 1
}

# Test backend health
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method "GET"
    Write-Host "✅ Backend is healthy" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not running. Please start it with: npm run server" -ForegroundColor Red
    exit 1
}

# Test login endpoint
try {
    $loginBody = @{
        username = "admin"
        password = "admin123"
    }
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method "POST" -Body ($loginBody | ConvertTo-Json) -ContentType "application/json"
    Write-Host "✅ Login endpoint is working" -ForegroundColor Green
    Write-Host "   Token received: $($loginResponse.data.token.Substring(0, 20))..." -ForegroundColor Yellow
} catch {
    Write-Host "❌ Login endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test profile endpoint with token
try {
    $headers = @{
        "Authorization" = "Bearer $($loginResponse.data.token)"
        "Content-Type" = "application/json"
    }
    
    $profileResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/profile" -Method "GET" -Headers $headers
    Write-Host "✅ Profile endpoint is working" -ForegroundColor Green
    Write-Host "   User: $($profileResponse.data.user.username)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Profile endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 Frontend V1 Authentication Test Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "✅ Backend: http://localhost:5000/api" -ForegroundColor Green
Write-Host "✅ V1 Authentication: Working" -ForegroundColor Green
Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "2. Login with username: admin, password: admin123" -ForegroundColor White
Write-Host "3. Navigate through the admin panel" -ForegroundColor White
Write-Host "4. Test all CRUD operations" -ForegroundColor White 