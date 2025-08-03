# 🔐 Keycloak JWT Integration for Automated Rights

## 📋 Overview

This system now supports Keycloak JWT authentication for automated rights management. External applications can authenticate users using Keycloak JWT tokens, and the admin backend will automatically verify these tokens using Keycloak's public key.

## 🎯 Use Case Scenario

**User Story:** User authenticates with Keycloak → Gets JWT token → Accesses APP-Y → APP-Y calls admin backend with JWT → Admin backend verifies JWT → Creates/returns rights

## 🏗️ System Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │    │   Keycloak  │    │   APP-Y     │
│  (Browser)  │    │  (Auth)     │    │  (External) │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       │ 1. Login         │ 2. JWT Token     │ 3. Forward JWT
       ├─────────────────►│ ───────────────► │ ───────────────►
       │                  │                  │
       │                  │                  │
                    ┌─────▼─────┐
                    │   Admin   │
                    │  Backend  │
                    │   API     │
                    └─────┬─────┘
                          │
                    ┌─────▼─────┐
                    │  MongoDB  │
                    │ Database  │
                    └───────────┘
```

## 🔧 Keycloak Configuration

### Environment Variables

```bash
# Keycloak Configuration
KEYCLOAK_REALM=master
KEYCLOAK_AUTH_SERVER_URL=http://localhost:8080
KEYCLOAK_CLIENT_ID=admin-client
KEYCLOAK_PUBLIC_KEY=null  # Auto-fetched from JWKS
```

### JWKS Endpoint

The system automatically fetches public keys from Keycloak's JWKS endpoint:

```
GET {KEYCLOAK_AUTH_SERVER_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs
```

## 🔧 API Endpoints

### 1. Check and Create Rights with Keycloak JWT

```http
POST /api/v1/automated-rights/keycloak/check-and-create
```

**Headers:**

```http
Authorization: Bearer {keycloak_jwt_token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "applicationId": "app_mongodb_id",
  "accountId": "account_mongodb_id" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "rightsCode": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "permissions": [],
    "status": "active",
    "expiresAt": "2024-02-15T00:00:00.000Z",
    "applicationName": "APP-Y",
    "accountName": "John Doe",
    "keycloakUserId": "keycloak_user_id"
  },
  "message": "New rights created with no permissions"
}
```

### 2. Check User Permissions with Keycloak JWT

```http
POST /api/v1/automated-rights/keycloak/check-permissions
```

**Headers:**

```http
Authorization: Bearer {keycloak_jwt_token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "applicationId": "app_mongodb_id"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "permissions": ["read", "write"],
    "rightsCode": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "status": "active",
    "expiresAt": "2024-02-15T00:00:00.000Z",
    "applicationName": "APP-Y",
    "accountName": "John Doe",
    "keycloakUserId": "keycloak_user_id"
  }
}
```

### 3. Update Permissions with Keycloak JWT

```http
PUT /api/v1/automated-rights/keycloak/update-permissions
```

**Headers:**

```http
Authorization: Bearer {keycloak_jwt_token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "applicationId": "app_mongodb_id",
  "permissions": ["read", "write", "admin"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "rightsCode": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "permissions": ["read", "write", "admin"],
    "status": "active",
    "message": "Permissions updated successfully",
    "keycloakUserId": "keycloak_user_id"
  }
}
```

### 4. Get User Applications with Keycloak JWT

```http
GET /api/v1/automated-rights/keycloak/user/applications
```

**Headers:**

```http
Authorization: Bearer {keycloak_jwt_token}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "applicationId": "app_id_1",
      "applicationName": "APP-Y",
      "permissions": ["read", "write"],
      "status": "active",
      "rightsCode": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2024-02-15T00:00:00.000Z"
    }
  ],
  "message": "Found 1 applications for user",
  "keycloakUserId": "keycloak_user_id"
}
```

## 🔄 Complete Workflow

### Step 1: User Authentication with Keycloak

```javascript
// User logs into Keycloak
const keycloakConfig = {
  url: "http://localhost:8080",
  realm: "master",
  clientId: "admin-client",
};

// Keycloak returns JWT token
const keycloakToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...";
```

### Step 2: External App Receives JWT

```javascript
// APP-Y receives JWT from user
const userJWT = req.headers.authorization; // "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 3: External App Calls Admin Backend

```javascript
// APP-Y forwards JWT to admin backend
const response = await fetch(
  "/api/v1/automated-rights/keycloak/check-and-create",
  {
    method: "POST",
    headers: {
      Authorization: userJWT,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      applicationId: "app_y_id",
    }),
  }
);
```

### Step 4: Admin Backend Verifies JWT

```javascript
// Admin backend verifies JWT using Keycloak public key
const decodedToken = await verifyKeycloakToken(keycloakToken);
const userInfo = extractUserInfo(decodedToken);

// Extracted user info:
// {
//   userId: "keycloak_user_id",
//   username: "john.doe",
//   email: "john.doe@example.com",
//   firstName: "John",
//   lastName: "Doe",
//   realmAccess: ["user"],
//   emailVerified: true
// }
```

### Step 5: Admin Backend Creates/Finds User

```javascript
// Find existing user or create new one
let user = await User.findOne({
  $or: [
    { email: userInfo.email },
    { username: userInfo.username },
    { keycloakId: userInfo.userId },
  ],
});

if (!user) {
  // Create new user from Keycloak data
  user = await User.create({
    username: userInfo.username,
    email: userInfo.email,
    keycloakId: userInfo.userId,
    // ... other fields
  });
}
```

### Step 6: Admin Backend Returns Rights

```javascript
// Return rights to external app
{
  "success": true,
  "data": {
    "rightsCode": "jwt_token_here",
    "permissions": [],
    "status": "active",
    "keycloakUserId": "keycloak_user_id"
  }
}
```

## 🗄️ Database Schema Updates

### User Model (Updated)

```javascript
{
  _id: ObjectId("user_id"),
  username: "john.doe",
  email: "john.doe@example.com",
  password: "hashed_password",
  role: "user",
  status: "active",
  accountId: ObjectId("account_id"),
  keycloakId: "keycloak_user_id", // ← New field for Keycloak integration
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Security Features

### 1. JWT Signature Verification

- Verifies JWT signature using Keycloak's public key
- Fetches public keys from Keycloak's JWKS endpoint
- Caches public keys for performance
- Supports key rotation

### 2. Token Validation

- Validates JWT issuer (Keycloak realm)
- Validates JWT audience (client ID)
- Checks token expiration
- Validates token algorithm (RS256)

### 3. User Information Extraction

- Extracts user ID from JWT `sub` claim
- Extracts username from `preferred_username` claim
- Extracts email from `email` claim
- Extracts roles from `realm_access.roles`

### 4. Automatic User Creation

- Creates users in admin system from Keycloak data
- Links users to accounts automatically
- Stores Keycloak user ID for future reference
- Maintains user-account relationships

## 📊 JWT Token Structure

### Header

```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "key-id-from-keycloak"
}
```

### Payload

```json
{
  "sub": "keycloak_user_id",
  "preferred_username": "john.doe",
  "email": "john.doe@example.com",
  "given_name": "John",
  "family_name": "Doe",
  "realm_access": {
    "roles": ["user", "app-user"]
  },
  "resource_access": {
    "admin-client": {
      "roles": ["user"]
    }
  },
  "email_verified": true,
  "iss": "http://localhost:8080/realms/master",
  "aud": "admin-client",
  "exp": 1705123456,
  "iat": 1705037056
}
```

## 🚀 Implementation Example

### For APP-Y (External Application):

```javascript
// When user with Keycloak JWT accesses APP-Y
async function handleKeycloakUserAccess(userJWT) {
  try {
    // Call admin backend with Keycloak JWT
    const response = await fetch(
      "/api/v1/automated-rights/keycloak/check-and-create",
      {
        method: "POST",
        headers: {
          Authorization: userJWT,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId: "app_y_id",
        }),
      }
    );

    const result = await response.json();

    if (result.success) {
      // Store rights code
      await storeRightsCode(result.data.rightsCode);

      // Grant access to user
      return {
        hasAccess: true,
        permissions: result.data.permissions,
        rightsCode: result.data.rightsCode,
      };
    } else {
      return {
        hasAccess: false,
        error: result.message,
      };
    }
  } catch (error) {
    console.error("Failed to check permissions:", error);
    return {
      hasAccess: false,
      error: "Authentication failed",
    };
  }
}

// Check if user has specific permission
async function checkUserPermission(userJWT, feature) {
  const response = await fetch(
    "/api/v1/automated-rights/keycloak/check-permissions",
    {
      method: "POST",
      headers: {
        Authorization: userJWT,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        applicationId: "app_y_id",
      }),
    }
  );

  const result = await response.json();

  if (result.success && result.data.hasAccess) {
    return result.data.permissions.includes(feature);
  }

  return false;
}
```

## 📈 Benefits

1. **🔐 Secure Authentication**: JWT verification using Keycloak's public key
2. **🔄 Seamless Integration**: Works with existing Keycloak infrastructure
3. **👤 Automatic User Management**: Creates users from Keycloak data
4. **🔑 No Password Management**: Relies on Keycloak for authentication
5. **📊 Centralized Identity**: Single source of truth for user identity
6. **🛡️ Enterprise Security**: Supports enterprise SSO solutions
7. **⚡ High Performance**: Cached public keys for fast verification

## 🎯 Summary

This Keycloak integration allows external applications to:

1. **Accept Keycloak JWT tokens** from users
2. **Forward JWT to admin backend** for verification
3. **Automatically create users** from Keycloak data
4. **Generate rights codes** for authenticated users
5. **Maintain security** through JWT signature verification

The system ensures that **every Keycloak user can be automatically integrated** into the admin system, providing a secure, scalable, and enterprise-ready authentication solution! 🚀
