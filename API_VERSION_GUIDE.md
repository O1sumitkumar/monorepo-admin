# API Version Management Guide

This guide explains how to use the versioned API system that allows easy switching between different API versions.

## 🚀 Overview

The API system now supports multiple versions with a centralized configuration that makes it easy to switch between:

- **V1**: JWT Authentication for Admin Panel
- **V2**: Keycloak Authentication for External Apps
- **Legacy**: Backward Compatibility

## 📁 File Structure

```
client/src/
├── config/
│   └── api.ts              # Centralized API configuration
├── services/
│   └── api.ts              # API service with versioned endpoints
└── components/
    └── ApiVersionSwitcher.tsx  # UI component for switching versions
```

## ⚙️ Configuration

### 1. API Configuration (`client/src/config/api.ts`)

```typescript
export const API_CONFIG = {
  // Change this to switch between API versions
  VERSION: "v1", // Options: "v1", "v2", "legacy"

  // Base URLs for different environments
  BASE_URLS: {
    development: "http://localhost:5000",
    production: "/api", // Use relative path in production
  },

  // Get the current base URL
  getBaseURL: () => {
    const env = import.meta.env.MODE;
    const baseURL =
      API_CONFIG.BASE_URLS[env] || API_CONFIG.BASE_URLS.development;

    // For legacy version, don't add version prefix
    if (API_CONFIG.VERSION === "legacy") {
      return `${baseURL}/api`;
    }

    // For versioned APIs, add version prefix
    return `${baseURL}/api/${API_CONFIG.VERSION}`;
  },
};
```

### 2. API Versions

```typescript
export const API_VERSIONS = {
  V1: "v1",
  V2: "v2",
  LEGACY: "legacy",
} as const;

export type ApiVersion = (typeof API_VERSIONS)[keyof typeof API_VERSIONS];
```

## 🔄 How to Switch API Versions

### Method 1: Change Configuration File

Edit `client/src/config/api.ts`:

```typescript
// Change this line to switch versions
VERSION: "v2", // Switch to V2
```

### Method 2: Use the Switcher Component

```typescript
import ApiVersionSwitcher from "../components/ApiVersionSwitcher";

// In your component
<ApiVersionSwitcher />;
```

### Method 3: Programmatic Switching

```typescript
import { switchApiVersion, API_VERSIONS } from "../config/api";

// Switch to V2
switchApiVersion(API_VERSIONS.V2);

// Switch to Legacy
switchApiVersion(API_VERSIONS.LEGACY);
```

## 🌐 Backend Route Structure

The backend now supports multiple versions:

```
/api/v1/*          # V1 endpoints (JWT Auth)
/api/v2/*          # V2 endpoints (Keycloak Auth)
/api/*             # Legacy endpoints (Backward compatibility)
```

### Server Configuration (`server/index.js`)

```javascript
// API routes - Mount V1 routes with version prefix
app.use("/api/v1", routes);

// Legacy routes (for backward compatibility) - Mount without version prefix
app.use("/api", routes);
```

## 📋 API Endpoints by Version

### V1 (JWT Authentication)

```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
GET    /api/v1/auth/profile
POST   /api/v1/auth/verify
GET    /api/v1/applications
GET    /api/v1/rights
GET    /api/v1/accounts
GET    /api/v1/users
GET    /api/v1/health
```

### V2 (Keycloak Authentication)

```
POST   /api/v2/auth/keycloak/login
POST   /api/v2/automated-rights/keycloak/check-and-create
POST   /api/v2/automated-rights/keycloak/check-permissions
GET    /api/v2/health
```

### Legacy (Backward Compatibility)

```
POST   /api/auth/login
GET    /api/applications
GET    /api/rights
GET    /api/accounts
GET    /api/users
GET    /api/health
```

## 🔧 Usage Examples

### 1. Making API Calls

```typescript
import { authAPI, applicationsAPI } from "../services/api";

// These calls automatically use the configured version
const login = async () => {
  const response = await authAPI.login({
    username: "admin",
    password: "admin123",
  });
  return response;
};

const getApplications = async () => {
  const response = await applicationsAPI.getAll();
  return response;
};
```

### 2. Checking Current Version

```typescript
import { API_CONFIG } from "../services/api";

console.log(`Current API Version: ${API_CONFIG.getVersion()}`);
console.log(`Base URL: ${API_CONFIG.getBaseURL()}`);
```

### 3. Dynamic Version Switching

```typescript
import { switchApiVersion, API_VERSIONS } from "../config/api";

// Switch to V2 for Keycloak authentication
const useKeycloakAuth = () => {
  switchApiVersion(API_VERSIONS.V2);
  // Now all API calls will use V2 endpoints
};

// Switch back to V1 for JWT authentication
const useJwtAuth = () => {
  switchApiVersion(API_VERSIONS.V1);
  // Now all API calls will use V1 endpoints
};
```

## 🎯 Version-Specific Features

### V1 (JWT Authentication)

- ✅ Traditional JWT token-based authentication
- ✅ Admin panel access
- ✅ User management
- ✅ Application management
- ✅ Rights management
- ✅ Account management

### V2 (Keycloak Authentication)

- ✅ Keycloak JWT verification
- ✅ External application integration
- ✅ Automated rights management
- ✅ Multi-application support
- ✅ APP-X integration

### Legacy (Backward Compatibility)

- ✅ Original API endpoints
- ✅ No version prefix
- ✅ Backward compatibility
- ✅ Existing integrations

## 🚀 Getting Started

### 1. Start the Backend Server

```bash
npm run server
```

The server will start with support for all versions:

- V1: http://localhost:5000/api/v1
- Legacy: http://localhost:5000/api

### 2. Start the Frontend

```bash
cd client
npm run dev
```

### 3. Switch API Versions

#### Option A: Edit Configuration

Edit `client/src/config/api.ts`:

```typescript
VERSION: "v1", // Change to "v2" or "legacy"
```

#### Option B: Use the Switcher Component

Add to your component:

```typescript
import ApiVersionSwitcher from "../components/ApiVersionSwitcher";

<ApiVersionSwitcher />;
```

#### Option C: Programmatic Switching

```typescript
import { switchApiVersion, API_VERSIONS } from "../config/api";

// Switch versions
switchApiVersion(API_VERSIONS.V1);
switchApiVersion(API_VERSIONS.V2);
switchApiVersion(API_VERSIONS.LEGACY);
```

## 🔍 Debugging

### Check Current Configuration

```typescript
import { API_CONFIG } from "../services/api";

console.log("API Configuration:", {
  version: API_CONFIG.getVersion(),
  baseURL: API_CONFIG.getBaseURL(),
  isLegacy: API_CONFIG.isLegacy(),
});
```

### Monitor API Requests

The API service automatically logs:

- Request URLs
- API version being used
- Response status codes
- Error messages

### Browser Console

Check the browser console for:

```
🌐 API Version: v1
API Request: POST /auth/login
API Response: 200 /auth/login
```

## 🛠️ Development Workflow

### 1. Default Development

- Start with V1 (JWT authentication)
- Use admin/admin123 credentials
- Test all CRUD operations

### 2. Testing V2 (Keycloak)

- Switch to V2 version
- Test Keycloak integration
- Test automated rights workflow

### 3. Testing Legacy

- Switch to Legacy version
- Ensure backward compatibility
- Test existing integrations

## 📚 Additional Resources

- [V1 Authentication Guide](./V1_AUTHENTICATION_GUIDE.md)
- [Backend API Documentation](./AUTOMATED_RIGHTS_WORKFLOW.md)
- [Testing Scripts](./test-v1-working.ps1)

## 🎉 Benefits

1. **Easy Version Switching**: Change one line to switch versions
2. **Backward Compatibility**: Legacy endpoints still work
3. **Centralized Configuration**: All API settings in one place
4. **Type Safety**: Full TypeScript support
5. **Debugging**: Built-in logging and monitoring
6. **Future-Proof**: Easy to add new versions

## 🔮 Future Versions

To add a new API version:

1. **Backend**: Create new routes in `server/routes/v2/`
2. **Frontend**: Add version to `API_VERSIONS`
3. **Configuration**: Update `API_CONFIG` if needed
4. **Testing**: Add version-specific tests

Example for V3:

```typescript
// In API_VERSIONS
V3: "v3",

// In server/index.js
app.use("/api/v3", v3Routes);

// In frontend config
VERSION: "v3",
```
