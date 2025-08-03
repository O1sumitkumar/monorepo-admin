Write-Host "Simple Rights API Test" -ForegroundColor Green

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODhmMTI2YmMxZjhmYjg4NDgyMWY0YWEiLCJpYXQiOjE3NTQyMTg4MjksImV4cCI6MTc1NDMwNTIyOX0.R1HIMy13T7M0uZzhMvh2bV2wkrOTmkDDMlfrlOW9Z6U"

$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/rights" -Method GET -Headers $headers
    Write-Host "SUCCESS: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
} 