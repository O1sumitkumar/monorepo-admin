# Simple login test
$baseUrl = "http://localhost:5000/api"

Write-Host "Testing login..." -ForegroundColor Green

try {
    $loginBody = @{
        username = "admin"
        password = "admin123"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method "POST" -Body ($loginBody | ConvertTo-Json) -ContentType "application/json"
    
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($response.data.token.Substring(0, 20))..." -ForegroundColor Yellow
    
    # Test profile with token
    $headers = @{
        "Authorization" = "Bearer $($response.data.token)"
        "Content-Type" = "application/json"
    }
    
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/auth/profile" -Method "GET" -Headers $headers
    Write-Host "✅ Profile retrieved successfully!" -ForegroundColor Green
    Write-Host "User: $($profileResponse.data.user.username)" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
} 