# Test Rights API Issue
Write-Host "Testing Rights API Issue..." -ForegroundColor Yellow

$baseUrl = "http://localhost:5000/api"

# First get token
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/v1/auth/login" -Method POST -Body $loginData -ContentType "application/json"
$loginResponse = $response.Content | ConvertFrom-Json
$token = $loginResponse.data.token

$headers = @{
    "Authorization" = "Bearer $token"
}

# Test Rights API with detailed error
Write-Host "Testing Rights API..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/rights" -Method GET -Headers $headers
    Write-Host "Rights API: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Rights API Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Error Details: $($_.Exception.Response)" -ForegroundColor Red
} 