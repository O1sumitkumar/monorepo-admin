# 🔄 Automated Rights Workflow for External Applications

## 📋 Overview

This system provides an automated workflow for external applications (APP-X, APP-Y, APP-Z) to check and create user permissions without manual admin intervention.

## 🎯 Use Case Scenario

**User Story:** Sumit registers in APP-Y → APP-Y calls admin backend → Admin backend checks/creates rights → Returns rights code to APP-Y

## 🏗️ System Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   APP-Y     │    │   APP-X     │    │   APP-Z     │
│  (External) │    │  (External) │    │  (External) │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
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

## 🔧 API Endpoints

### 1. Check and Create Rights

```http
POST /api/v1/automated-rights/check-and-create
```

**Request Body:**

```json
{
  "userId": "user_mongodb_id",
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
    "permissions": ["read", "write"],
    "status": "active",
    "expiresAt": "2024-02-15T00:00:00.000Z",
    "applicationName": "APP-Y",
    "accountName": "Sumit's Account"
  },
  "message": "Existing rights found"
}
```

### 2. Check User Permissions

```http
POST /api/v1/automated-rights/check-permissions
```

**Request Body:**

```json
{
  "userId": "user_mongodb_id",
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
    "accountName": "Sumit's Account"
  }
}
```

### 3. Update Permissions

```http
PUT /api/v1/automated-rights/update-permissions
```

**Request Body:**

```json
{
  "userId": "user_mongodb_id",
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
    "message": "Permissions updated successfully"
  }
}
```

### 4. Get User Applications

```http
GET /api/v1/automated-rights/user/{userId}/applications
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
    },
    {
      "applicationId": "app_id_2",
      "applicationName": "APP-X",
      "permissions": ["read"],
      "status": "active",
      "rightsCode": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2024-03-15T00:00:00.000Z"
    }
  ],
  "message": "Found 2 applications for user"
}
```

## 🔄 Complete Workflow

### Step 1: User Registration in External App

```
User "Sumit" registers in APP-Y
APP-Y creates user account
APP-Y needs to check permissions with admin backend
```

### Step 2: External App Calls Admin Backend

```javascript
// APP-Y makes this API call
const response = await fetch("/api/v1/automated-rights/check-and-create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer admin_token",
  },
  body: JSON.stringify({
    userId: "sumit_user_id",
    applicationId: "app_y_id",
  }),
});
```

### Step 3: Admin Backend Processing

```javascript
// Backend logic:
1. Validate application exists
2. Find user and get their account
3. Check if rights already exist for user-application combination
4. If rights exist: Return existing rights
5. If rights don't exist: Create new rights with empty permissions
6. Return rights code to external application
```

### Step 4: Response to External App

```javascript
// APP-Y receives:
{
  "success": true,
  "data": {
    "rightsCode": "jwt_token_here",
    "permissions": [], // Empty initially
    "status": "active",
    "applicationName": "APP-Y",
    "accountName": "Sumit's Account"
  },
  "message": "New rights created with no permissions"
}
```

### Step 5: External App Uses Rights Code

```javascript
// APP-Y can now:
1. Store the rights code
2. Use it for authentication
3. Check permissions before allowing actions
4. Request permission updates when needed
```

## 🗄️ Database Flow

### 1. User Table

```javascript
{
  _id: ObjectId("user_id"),
  username: "sumit",
  email: "sumit@example.com",
  password: "hashed_password",
  role: "user",
  status: "active",
  accountId: ObjectId("account_id"), // ← Links to Account
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Account Table

```javascript
{
  _id: ObjectId("account_id"),
  name: "Sumit's Account",
  accountId: "sumit-account-001",
  email: "sumit@example.com",
  accountType: "Personal",
  status: "active",
  sharedAccounts: [],
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Rights Table

```javascript
{
  _id: ObjectId("rights_id"),
  applicationId: ObjectId("app_y_id"), // ← References Application
  accountId: ObjectId("account_id"),   // ← References Account
  rightsCode: "jwt_token_here",
  permissions: [], // ← Empty initially, can be updated later
  status: "active",
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Security Features

### 1. JWT Rights Codes

- Auto-generated JWT tokens for secure access
- Include application and account information
- Can be verified independently

### 2. Unique Constraints

- One rights record per application-account combination
- Prevents duplicate permissions
- Ensures data integrity

### 3. Permission Levels

- `read`: Basic read access
- `write`: Read and write access
- `admin`: Administrative access
- `owner`: Full ownership access

### 4. Expiration Support

- Rights can have expiration dates
- Automatic status updates based on expiration
- Secure time-based access control

## 📊 Business Rules

### ✅ What Works:

1. **Automatic Rights Creation**: External apps can trigger rights creation
2. **Empty Permissions**: New rights start with no permissions (secure by default)
3. **Unique Combinations**: One rights record per app-account combination
4. **JWT Security**: Secure token-based access
5. **Permission Updates**: Can update permissions later
6. **User-Account Linking**: Every user must have an account

### ❌ What's Blocked:

1. **Duplicate Rights**: Cannot create multiple rights for same app-account
2. **Invalid Users**: Users must exist in admin system
3. **Invalid Applications**: Applications must be registered
4. **Orphaned Users**: Users cannot exist without accounts

## 🚀 Implementation Example

### For APP-Y (External Application):

```javascript
// When user registers in APP-Y
async function handleUserRegistration(userData) {
  // 1. Create user in APP-Y
  const appYUser = await createUserInAppY(userData);

  // 2. Call admin backend to check/create rights
  const rightsResponse = await fetch(
    "/api/v1/automated-rights/check-and-create",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer admin_token",
      },
      body: JSON.stringify({
        userId: appYUser.adminUserId, // User ID from admin system
        applicationId: "app_y_id", // APP-Y's application ID
      }),
    }
  );

  const rights = await rightsResponse.json();

  // 3. Store rights code in APP-Y
  await storeRightsCode(appYUser.id, rights.data.rightsCode);

  // 4. User can now access APP-Y with the rights code
  return rights.data;
}

// When user tries to access a feature
async function checkUserPermission(userId, feature) {
  const rightsCode = await getRightsCode(userId);

  // Verify the rights code
  const permissionResponse = await fetch(
    "/api/v1/automated-rights/check-permissions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer admin_token",
      },
      body: JSON.stringify({
        userId: userId,
        applicationId: "app_y_id",
      }),
    }
  );

  const permissions = await permissionResponse.json();

  // Check if user has required permission
  if (permissions.data.permissions.includes(feature)) {
    return true; // Allow access
  } else {
    return false; // Deny access
  }
}
```

## 📈 Benefits

1. **🔧 Automation**: No manual admin intervention required
2. **🔒 Security**: JWT-based secure access
3. **⚡ Speed**: Instant rights creation and checking
4. **📊 Centralized**: All permissions managed in one place
5. **🔄 Scalable**: Easy to add new external applications
6. **🎯 Flexible**: Can update permissions as needed
7. **🛡️ Safe**: Empty permissions by default (secure by default)

## 🎯 Summary

This automated workflow allows external applications to:

1. **Automatically check** if a user has rights for their application
2. **Automatically create** rights if they don't exist (with empty permissions)
3. **Get secure JWT tokens** for authentication
4. **Check permissions** before allowing actions
5. **Update permissions** when needed

The system ensures that **every user points to an account** and **each account can have only one rights record per application**, providing a secure, scalable, and automated permission management system! 🚀
