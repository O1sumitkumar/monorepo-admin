# V1 Authentication Guide for Frontend

This guide explains how to use V1 JWT authentication in the frontend application.

## Overview

V1 authentication uses traditional JWT tokens for admin panel access. This is different from V2 Keycloak authentication which is used for external applications.

## 🔐 Authentication Flow

### 1. Login Process

```typescript
// Login component example
import { useDispatch } from "react-redux";
import { login } from "../store/slices/authSlice";

const Login = () => {
  const dispatch = useDispatch();

  const handleLogin = async (credentials: {
    username: string;
    password: string;
  }) => {
    try {
      await dispatch(login(credentials)).unwrap();
      // Login successful - user will be redirected automatically
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input name="username" placeholder="Username" />
      <input name="password" type="password" placeholder="Password" />
      <button type="submit">Sign In</button>
    </form>
  );
};
```

### 2. API Configuration

The frontend is configured to use V1 authentication endpoints:

```typescript
// services/api.ts
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post<AuthResponse>("/auth/login", credentials),
  register: (userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }) => api.post<AuthResponse>("/auth/register", userData),
  logout: () => api.post("/auth/logout"),
  verifyToken: (token: string) =>
    api.post<VerifyResponse>("/auth/verify", { token }),
  getProfile: () => api.get<ProfileResponse>("/auth/profile"),
  changePassword: (passwords: {
    currentPassword: string;
    newPassword: string;
  }) => api.post("/auth/change-password", passwords),
};
```

### 3. Redux State Management

The authentication state is managed in Redux:

```typescript
// store/slices/authSlice.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Actions
export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const authData = response.data.data;

      // Store token and user data
      localStorage.setItem("token", authData.token);
      localStorage.setItem("user", JSON.stringify(authData.user));

      return authData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Login failed");
    }
  }
);
```

## 🛡️ Protected Routes

### 1. Route Protection

```typescript
// components/ProtectedRoute.tsx
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useSelector(
    (state: RootState) => state.auth
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

### 2. App Routing

```typescript
// App.tsx
function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="applications" element={<Applications />} />
            <Route path="rights" element={<Rights />} />
            <Route path="users" element={<Users />} />
            <Route path="accounts" element={<Accounts />} />
          </Route>
        </Routes>
      </Router>
    </Provider>
  );
}
```

## 🔧 API Interceptor

### 1. Automatic Token Injection

```typescript
// services/api.ts
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - automatically add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

### 2. Response Interceptor - Handle 401 Errors

```typescript
// Response interceptor - handle authentication errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

## 📝 Usage Examples

### 1. Making Authenticated API Calls

```typescript
// Any component can make authenticated API calls
import { applicationsAPI } from "../services/api";

const Applications = () => {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await applicationsAPI.getAll();
        setApplications(response.data.data);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
      }
    };

    fetchApplications();
  }, []);

  return (
    <div>
      {applications.map((app) => (
        <div key={app.id}>{app.name}</div>
      ))}
    </div>
  );
};
```

### 2. User Profile Management

```typescript
// components/UserProfile.tsx
import { useSelector, useDispatch } from "react-redux";
import { getProfile, changePassword } from "../store/slices/authSlice";

const UserProfile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleChangePassword = async (passwords: {
    currentPassword: string;
    newPassword: string;
  }) => {
    try {
      await dispatch(changePassword(passwords)).unwrap();
      alert("Password changed successfully");
    } catch (error) {
      alert("Failed to change password");
    }
  };

  return (
    <div>
      <h2>Profile</h2>
      <p>Username: {user?.username}</p>
      <p>Email: {user?.email}</p>
      <p>Role: {user?.role}</p>
      {/* Password change form */}
    </div>
  );
};
```

### 3. Logout Functionality

```typescript
// components/Header.tsx
import { useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";

const Header = () => {
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      // User will be redirected to login automatically
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header>
      <button onClick={handleLogout}>Logout</button>
    </header>
  );
};
```

## 🔑 Demo Credentials

For testing purposes, use these credentials:

```
Username: admin
Password: admin123
```

## 🚀 Getting Started

1. **Start the Backend Server**

   ```bash
   npm run server
   ```

2. **Start the Frontend**

   ```bash
   cd client
   npm run dev
   ```

3. **Access the Application**
   - Open: http://localhost:5173
   - Login with demo credentials
   - Navigate through the admin panel

## 📋 API Endpoints

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify` - Verify token
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/change-password` - Change password

### Protected Endpoints

- `GET /api/applications` - Get all applications
- `POST /api/applications` - Create application
- `GET /api/rights` - Get all rights
- `POST /api/rights` - Create rights
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create account
- `GET /api/users` - Get all users
- `POST /api/users` - Create user

## 🔒 Security Features

1. **Automatic Token Management**

   - Tokens are automatically added to API requests
   - Invalid tokens are cleared on 401 errors
   - Users are redirected to login on authentication failure

2. **Route Protection**

   - All admin routes require authentication
   - Unauthenticated users are redirected to login
   - Loading states are handled during authentication checks

3. **Persistent Sessions**
   - User sessions persist across browser refreshes
   - Token and user data are stored in localStorage
   - Automatic session restoration on app load

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized Errors**

   - Check if token is valid
   - Verify backend server is running
   - Clear localStorage and login again

2. **Login Fails**

   - Verify credentials are correct
   - Check backend server status
   - Review browser console for errors

3. **API Calls Fail**
   - Ensure backend server is running on port 5000
   - Check CORS configuration
   - Verify API endpoints are correct

### Debug Mode

Enable debug logging by checking the browser console for:

- API request/response logs
- Authentication state changes
- Error messages

## 📚 Additional Resources

- [Backend V1 Authentication Documentation](./AUTOMATED_RIGHTS_WORKFLOW.md)
- [API Testing Scripts](./test-v1-working.ps1)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React Router Documentation](https://reactrouter.com/)
