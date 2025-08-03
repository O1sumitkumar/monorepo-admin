import axios from "axios";
import API_CONFIG from "../config/api.js";

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
export interface ApiResponse<T = unknown> {
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

// Create axios instance with dynamic base URL from configuration
const api = axios.create({
  baseURL: API_CONFIG.getBaseURL(),
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
    console.log(`🌐 API Version: ${API_CONFIG.getVersion()}`);
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

// Auth API - Uses centralized configuration
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

// Applications API - Uses centralized configuration
export const applicationsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<Application[]>>("/applications", { params }),
  getById: (id: string) =>
    api.get<ApiResponse<Application>>(`/applications/${id}`),
  create: (data: Partial<Application>) =>
    api.post<ApiResponse<Application>>("/applications", data),
  update: (id: string, data: Partial<Application>) =>
    api.put<ApiResponse<Application>>(`/applications/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/applications/${id}`),
  getStats: () => api.get<ApiResponse>("/applications/stats/overview"),
  toggleStatus: (id: string) =>
    api.patch<ApiResponse<Application>>(`/applications/${id}/toggle-status`),
  getActive: () =>
    api.get<ApiResponse<Application[]>>("/applications/active/list"),
};

// Rights API - Uses centralized configuration
export const rightsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<Rights[]>>("/rights", { params }),
  getById: (id: string) => api.get<ApiResponse<Rights>>(`/rights/${id}`),
  create: (data: {
    applicationId: string;
    accountId: string;
    permissions: Permission[];
    expiresAt?: string;
  }) => api.post<ApiResponse<Rights>>("/rights", data),
  update: (id: string, data: Partial<Rights>) =>
    api.put<ApiResponse<Rights>>(`/rights/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/rights/${id}`),
  getStats: () => api.get<ApiResponse>("/rights/stats/overview"),
  verify: (data: {
    applicationId: string;
    accountId: string;
    permissions: Permission[];
  }) => api.post<ApiResponse>("/rights/verify", data),
};

// Accounts API - Uses centralized configuration
export const accountsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<Account[]>>("/accounts", { params }),
  getById: (id: string) => api.get<ApiResponse<Account>>(`/accounts/${id}`),
  create: (data: Partial<Account>) =>
    api.post<ApiResponse<Account>>("/accounts", data),
  update: (id: string, data: Partial<Account>) =>
    api.put<ApiResponse<Account>>(`/accounts/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/accounts/${id}`),
  getStats: () => api.get<ApiResponse>("/accounts/stats/overview"),
  share: (
    id: string,
    data: {
      targetAccountId: string;
      permissions: Permission[];
      expiresAt?: string;
    }
  ) => api.post<ApiResponse<AccountSharing>>(`/accounts/${id}/share`, data),
  updateSharing: (sharingId: string, data: Partial<AccountSharing>) =>
    api.put<ApiResponse<AccountSharing>>(`/accounts/share/${sharingId}`, data),
  revokeSharing: (sharingId: string) =>
    api.delete<ApiResponse>(`/accounts/share/${sharingId}`),
  getSharing: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<AccountSharing[]>>("/account-sharing", { params }),
  createSharing: (data: Partial<AccountSharing>) =>
    api.post<ApiResponse<AccountSharing>>("/account-sharing", data),
  updateSharingStatus: (id: string, status: string) =>
    api.put<ApiResponse<AccountSharing>>(`/account-sharing/${id}`, { status }),
  deleteSharing: (id: string) =>
    api.delete<ApiResponse>(`/account-sharing/${id}`),
};

// Account Sharing API - Dedicated API for account sharing operations
export const accountSharingAPI = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<AccountSharing[]>>("/account-sharing", { params }),
  getById: (id: string) =>
    api.get<ApiResponse<AccountSharing>>(`/account-sharing/${id}`),
  create: (data: {
    sourceAccountId: string;
    targetAccountId: string;
    invitedBy: string;
    expiresAt?: string;
  }) => api.post<ApiResponse<AccountSharing>>("/account-sharing", data),
  update: (id: string, data: Partial<AccountSharing>) =>
    api.put<ApiResponse<AccountSharing>>(`/account-sharing/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/account-sharing/${id}`),
  activate: (id: string) =>
    api.patch<ApiResponse<AccountSharing>>(`/account-sharing/${id}/activate`),
  revoke: (id: string) =>
    api.patch<ApiResponse<AccountSharing>>(`/account-sharing/${id}/revoke`),
  getPendingInvitations: () =>
    api.get<ApiResponse<AccountSharing[]>>("/account-sharing/pending"),
  getByAccount: (accountId: string) =>
    api.get<ApiResponse<AccountSharing[]>>(
      `/account-sharing/account/${accountId}`
    ),
};

// Users API - Uses centralized configuration
export const usersAPI = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<User[]>>("/users", { params }),
  getById: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),
  create: (data: Partial<User>) => api.post<ApiResponse<User>>("/users", data),
  update: (id: string, data: Partial<User>) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/users/${id}`),
  getStats: () => api.get<ApiResponse>("/users/stats/overview"),
  changePassword: (
    id: string,
    passwords: {
      currentPassword: string;
      newPassword: string;
    }
  ) => api.post<ApiResponse>(`/users/${id}/change-password`, passwords),
};

// Automated Rights API - Uses centralized configuration
export const automatedRightsAPI = {
  checkAndCreate: (data: { userId: string; applicationId: string }) =>
    api.post<ApiResponse>("/automated-rights/check-and-create", data),
  checkPermissions: (data: { userId: string; applicationId: string }) =>
    api.post<ApiResponse>("/automated-rights/check-permissions", data),
  updatePermissions: (data: {
    userId: string;
    applicationId: string;
    permissions: Permission[];
  }) => api.put<ApiResponse>("/automated-rights/update-permissions", data),
  getUserApplications: () =>
    api.get<ApiResponse>("/automated-rights/user/applications"),
};

// Multi-Application Integration API - Uses centralized configuration
export const appXAPI = {
  checkUser: (data: Record<string, unknown>) =>
    api.post<ApiResponse>(`/app-x/check-user`, data),
  validateRights: (data: Record<string, unknown>) =>
    api.post<ApiResponse>(`/app-x/validate-rights`, data),
  getUserPermissions: (userId: string, applicationId: string) =>
    api.get<ApiResponse>(
      `/app-x/user/${userId}/application/${applicationId}/permissions`
    ),
  getUserApplications: (userId: string) =>
    api.get<ApiResponse>(`/app-x/user/${userId}/applications`),
  bulkValidate: (data: Record<string, unknown>) =>
    api.post<ApiResponse>(`/app-x/bulk-validate`, data),
  registerApplication: (data: Record<string, unknown>) =>
    api.post<ApiResponse>(`/app-x/register-application`, data),
  getApplications: () => api.get<ApiResponse>(`/app-x/applications`),
  health: () => api.get<ApiResponse>(`/app-x/health`),
};

// Health check - Uses centralized configuration
export const healthAPI = {
  check: () => api.get<ApiResponse>("/health"),
};

// Export the API configuration for easy access
export { API_CONFIG } from "../config/api.js";

export default api;
