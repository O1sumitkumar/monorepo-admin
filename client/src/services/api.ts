import axios from "axios";

// Data Models matching backend
export interface Application {
  id: string;
  name: string;
  applicationId: string; // APP-X identifier
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  accountId: string;
  email?: string;
  description?: string;
  accountType: "Temporary" | "Personal" | "Business";
  status: "active" | "inactive";
  sharedAccounts: string[]; // Account IDs this account shares with
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user" | "manager";
  status: "active" | "inactive";
  accountId: string; // Reference to Account
  createdAt: string;
  updatedAt: string;
}

export interface Rights {
  id: string;
  applicationId: string;
  applicationName: string;
  accountId: string;
  accountName: string;
  rightsCode: string; // JWT token
  permissions: Permission[];
  expiresAt?: string;
  status: "active" | "inactive" | "expired";
  createdAt: string;
  updatedAt: string;
}

export interface AccountSharing {
  id: string;
  sourceAccountId: string;
  targetAccountId: string;
  status: "pending" | "active" | "revoked";
  invitedBy: string;
  invitedAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type Permission = "read" | "write" | "admin" | "owner";

// API Response Types
export interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      username: string;
      email: string;
      role: "admin" | "user" | "manager";
      status: "active" | "inactive";
      accountId: string; // Reference to Account
      createdAt: string;
      updatedAt: string;
    };
    token: string;
  };
  message: string;
}

export interface ProfileResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      username: string;
      email: string;
      role: "admin" | "user" | "manager";
      status: "active" | "inactive";
      accountId: string; // Reference to Account
      createdAt: string;
      updatedAt: string;
    };
  };
  message: string;
}

export interface VerifyResponse {
  success: boolean;
  data?: {
    valid: boolean;
    user: {
      id: string;
      username: string;
      email: string;
      role: "admin" | "user" | "manager";
      status: "active" | "inactive";
      accountId: string; // Reference to Account
      createdAt: string;
      updatedAt: string;
    };
  };
  message: string;
}

// Legacy response types for backward compatibility
export interface LegacyAuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    role: "admin" | "user";
    createdAt: string;
    updatedAt: string;
  };
  token: string;
  message: string;
}

export interface LegacyProfileResponse {
  user: {
    id: string;
    username: string;
    email: string;
    role: "admin" | "user";
    createdAt: string;
    updatedAt: string;
  };
  message: string;
}

export interface LegacyVerifyResponse {
  valid: boolean;
  user: {
    id: string;
    username: string;
    email: string;
    role: "admin" | "user";
    createdAt: string;
    updatedAt: string;
  };
  message: string;
}

// Generic API Response Type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Create axios instance with proper base URL
const api = axios.create({
  baseURL: import.meta.env.PROD ? "/api" : "/api", // Use proxy in development
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log the request URL for debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(
      "API Response Error:",
      error.response?.status,
      error.response?.data
    );
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API - Updated to use v1 endpoints
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post<AuthResponse>("/v1/auth/login", credentials),
  register: (userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }) => api.post<AuthResponse>("/v1/auth/register", userData),
  logout: () => api.post("/v1/auth/logout"),
  verifyToken: (token: string) =>
    api.post<VerifyResponse>("/v1/auth/verify", { token }),
  getProfile: () => api.get<ProfileResponse>("/v1/auth/profile"),
  changePassword: (passwords: {
    currentPassword: string;
    newPassword: string;
  }) => api.post("/v1/auth/change-password", passwords),
};

// Applications API - Updated to use v1 endpoints
export const applicationsAPI = {
  getAll: (params?: any) =>
    api.get<ApiResponse<Application[]>>("/v1/applications", { params }),
  getById: (id: string) =>
    api.get<ApiResponse<Application>>(`/v1/applications/${id}`),
  create: (data: Partial<Application>) =>
    api.post<ApiResponse<Application>>("/v1/applications", data),
  update: (id: string, data: Partial<Application>) =>
    api.put<ApiResponse<Application>>(`/v1/applications/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/v1/applications/${id}`),
  getStats: () => api.get<ApiResponse>("/v1/applications/stats/overview"),
  toggleStatus: (id: string) =>
    api.patch<ApiResponse<Application>>(`/v1/applications/${id}/toggle-status`),
  getActive: () =>
    api.get<ApiResponse<Application[]>>("/v1/applications/active/list"),
};

// Rights API - Updated to use v1 endpoints
export const rightsAPI = {
  getAll: (params?: any) =>
    api.get<ApiResponse<Rights[]>>("/v1/rights", { params }),
  getById: (id: string) => api.get<ApiResponse<Rights>>(`/v1/rights/${id}`),
  create: (data: {
    applicationId: string;
    accountId: string;
    permissions: Permission[];
    expiresAt?: string;
  }) => api.post<ApiResponse<Rights>>("/v1/rights", data),
  update: (id: string, data: Partial<Rights>) =>
    api.put<ApiResponse<Rights>>(`/v1/rights/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/v1/rights/${id}`),
  getStats: () => api.get<ApiResponse>("/v1/rights/stats/overview"),
  verify: (data: {
    applicationId: string;
    accountId: string;
    permissions: Permission[];
  }) => api.post<ApiResponse>("/v1/rights/verify", data),
};

// Accounts API - Updated to use v1 endpoints
export const accountsAPI = {
  getAll: (params?: any) =>
    api.get<ApiResponse<Account[]>>("/v1/accounts", { params }),
  getById: (id: string) => api.get<ApiResponse<Account>>(`/v1/accounts/${id}`),
  create: (data: Partial<Account>) =>
    api.post<ApiResponse<Account>>("/v1/accounts", data),
  update: (id: string, data: Partial<Account>) =>
    api.put<ApiResponse<Account>>(`/v1/accounts/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/v1/accounts/${id}`),
  getStats: () => api.get<ApiResponse>("/v1/accounts/stats/overview"),
  share: (
    id: string,
    data: {
      targetAccountId: string;
      permissions: Permission[];
      expiresAt?: string;
    }
  ) => api.post<ApiResponse<AccountSharing>>(`/v1/accounts/${id}/share`, data),
  updateSharing: (sharingId: string, data: Partial<AccountSharing>) =>
    api.put<ApiResponse<AccountSharing>>(
      `/v1/accounts/share/${sharingId}`,
      data
    ),
  deleteSharing: (sharingId: string) =>
    api.delete<ApiResponse>(`/v1/accounts/share/${sharingId}`),
};

// Account Sharing API - New dedicated API for account sharing
export const accountSharingAPI = {
  getAll: (params?: any) =>
    api.get<ApiResponse<AccountSharing[]>>("/v1/account-sharing", { params }),
  getById: (id: string) =>
    api.get<ApiResponse<AccountSharing>>(`/v1/account-sharing/${id}`),
  create: (data: {
    sourceAccountId: string;
    targetAccountId: string;
    invitedBy: string;
    expiresAt?: string;
  }) => api.post<ApiResponse<AccountSharing>>("/v1/account-sharing", data),
  update: (id: string, data: Partial<AccountSharing>) =>
    api.put<ApiResponse<AccountSharing>>(`/v1/account-sharing/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/v1/account-sharing/${id}`),
  activate: (id: string) =>
    api.patch<ApiResponse<AccountSharing>>(
      `/v1/account-sharing/${id}/activate`
    ),
  revoke: (id: string) =>
    api.patch<ApiResponse<AccountSharing>>(`/v1/account-sharing/${id}/revoke`),
  getPendingInvitations: () =>
    api.get<ApiResponse<AccountSharing[]>>("/v1/account-sharing/pending"),
  getByAccount: (accountId: string) =>
    api.get<ApiResponse<AccountSharing[]>>(
      `/v1/account-sharing/account/${accountId}`
    ),
};

// Users API - Updated to use v1 endpoints
export const usersAPI = {
  getAll: (params?: any) =>
    api.get<ApiResponse<User[]>>("/v1/users", { params }),
  getById: (id: string) => api.get<ApiResponse<User>>(`/v1/users/${id}`),
  create: (data: Partial<User>) =>
    api.post<ApiResponse<User>>("/v1/users", data),
  update: (id: string, data: Partial<User>) =>
    api.put<ApiResponse<User>>(`/v1/users/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/v1/users/${id}`),
  getStats: () => api.get<ApiResponse>("/v1/users/stats/overview"),
};

// Multi-Application Integration API - Updated to use v1 endpoints
export const appXAPI = {
  checkUser: (data: any) => api.post<ApiResponse>("/v1/app-x/check-user", data),
  validateRights: (data: any) =>
    api.post<ApiResponse>("/v1/app-x/validate-rights", data),
  getUserPermissions: (userId: string, applicationId: string) =>
    api.get<ApiResponse>(
      `/v1/app-x/user/${userId}/application/${applicationId}/permissions`
    ),
  getUserApplications: (userId: string) =>
    api.get<ApiResponse>(`/v1/app-x/user/${userId}/applications`),
  bulkValidate: (data: any) =>
    api.post<ApiResponse>("/v1/app-x/bulk-validate", data),
  registerApplication: (data: any) =>
    api.post<ApiResponse>("/v1/app-x/register-application", data),
  getApplications: () => api.get<ApiResponse>("/v1/app-x/applications"),
  health: () => api.get<ApiResponse>("/v1/app-x/health"),
};

// Health check - Updated to use v1 endpoint
export const healthAPI = {
  check: () => api.get<ApiResponse>("/health"),
};

export default api;
