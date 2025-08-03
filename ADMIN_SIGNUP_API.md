# Admin Signup API Documentation

## Overview

The Admin Signup API allows authorized users to create new admin accounts with enhanced security measures and validation.

## Endpoint

```
POST /api/v1/auth/admin-signup
```

## Request Headers

```
Content-Type: application/json
```

## Request Body

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "adminCode": "string"
}
```

### Field Requirements

| Field       | Type   | Required | Validation Rules                                                      |
| ----------- | ------ | -------- | --------------------------------------------------------------------- |
| `username`  | string | Yes      | 4-30 characters, alphanumeric + underscore only                       |
| `email`     | string | Yes      | Valid email format                                                    |
| `password`  | string | Yes      | Min 8 chars, must contain: lowercase, uppercase, number, special char |
| `adminCode` | string | Yes      | Must match environment variable `ADMIN_SIGNUP_CODE`                   |

### Password Requirements

- Minimum 8 characters
- Must contain at least:
  - One lowercase letter (a-z)
  - One uppercase letter (A-Z)
  - One number (0-9)
  - One special character (@$!%\*?&)

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "admin",
      "accountId": "string",
      "createdAt": "string",
      "updatedAt": "string"
    },
    "token": "string"
  },
  "message": "Admin user created successfully"
}
```

### Error Responses

#### 400 Bad Request - Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "username",
      "message": "Username must be between 4 and 30 characters",
      "value": "a"
    }
  ]
}
```

#### 400 Bad Request - User Already Exists

```json
{
  "success": false,
  "message": "Username or email already exists"
}
```

#### 403 Forbidden - Invalid Admin Code

```json
{
  "success": false,
  "message": "Invalid admin signup code"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Security Features

### 1. Admin Code Verification

- Requires a valid admin signup code
- Default code: `ADMIN2024`
- Can be customized via environment variable `ADMIN_SIGNUP_CODE`

### 2. Enhanced Password Security

- Higher salt rounds (12) for admin accounts
- Stricter password requirements
- Password hashing with bcrypt

### 3. Account Assignment

- Automatically assigns admin users to a business account
- Creates default admin account if none exists
- Ensures proper account-user relationship

### 4. Input Validation

- Comprehensive validation for all fields
- Sanitization of inputs
- Protection against common attack vectors

## Environment Variables

| Variable            | Default     | Description                           |
| ------------------- | ----------- | ------------------------------------- |
| `ADMIN_SIGNUP_CODE` | `ADMIN2024` | Secret code required for admin signup |

## Example Usage

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/auth/admin-signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "email": "admin@company.com",
    "password": "Admin@123",
    "adminCode": "ADMIN2024"
  }'
```

### JavaScript/Axios

```javascript
const response = await axios.post("/api/v1/auth/admin-signup", {
  username: "superadmin",
  email: "admin@company.com",
  password: "Admin@123",
  adminCode: "ADMIN2024",
});
```

### Python/Requests

```python
import requests

response = requests.post('http://localhost:5000/api/v1/auth/admin-signup', json={
  'username': 'superadmin',
  'email': 'admin@company.com',
  'password': 'Admin@123',
  'adminCode': 'ADMIN2024'
})
```

## Testing

### Valid Admin Signup

```json
{
  "username": "superadmin",
  "email": "admin@company.com",
  "password": "Admin@123",
  "adminCode": "ADMIN2024"
}
```

### Invalid Examples

#### Weak Password

```json
{
  "username": "admin",
  "email": "admin@company.com",
  "password": "weak",
  "adminCode": "ADMIN2024"
}
```

#### Invalid Email

```json
{
  "username": "admin",
  "email": "invalid-email",
  "password": "Admin@123",
  "adminCode": "ADMIN2024"
}
```

#### Wrong Admin Code

```json
{
  "username": "admin",
  "email": "admin@company.com",
  "password": "Admin@123",
  "adminCode": "WRONG_CODE"
}
```

## Notes

1. **Account Assignment**: Admin users are automatically assigned to a business account
2. **Token Generation**: A JWT token is returned upon successful signup
3. **Role Assignment**: All users created via this endpoint have `role: "admin"`
4. **Status**: Admin users are created with `status: "active"`
5. **Password Hashing**: Uses bcrypt with 12 salt rounds for enhanced security

## Error Handling

The API includes comprehensive error handling for:

- Validation errors
- Duplicate username/email
- Invalid admin code
- Database errors
- Server errors

All errors return appropriate HTTP status codes and descriptive error messages.
