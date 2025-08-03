import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { authAPI } from "../../services/api";
import type {
  AuthResponse,
  ProfileResponse,
  VerifyResponse,
  LegacyAuthResponse,
  LegacyProfileResponse,
  LegacyVerifyResponse,
} from "../../services/api";

// Types
interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: "admin" | "user";
}

// Type guards
const isNewAuthResponse = (data: any): data is AuthResponse => {
  return data && typeof data.success === "boolean" && data.data;
};

const isLegacyAuthResponse = (data: any): data is LegacyAuthResponse => {
  return data && data.user && data.token;
};

const isNewVerifyResponse = (data: any): data is VerifyResponse => {
  return data && typeof data.success === "boolean" && data.data;
};

const isLegacyVerifyResponse = (data: any): data is LegacyVerifyResponse => {
  return data && typeof data.valid === "boolean" && data.user;
};

const isNewProfileResponse = (data: any): data is ProfileResponse => {
  return data && typeof data.success === "boolean" && data.data;
};

const isLegacyProfileResponse = (data: any): data is LegacyProfileResponse => {
  return data && data.user;
};

// Async thunks
export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const data = response.data;

      let authData: { user: User; token: string };

      if (isNewAuthResponse(data) && data.data) {
        authData = data.data;
      } else if (isLegacyAuthResponse(data)) {
        authData = data;
      } else {
        throw new Error("Invalid response format");
      }

      localStorage.setItem("token", authData.token);
      localStorage.setItem("user", JSON.stringify(authData.user));
      return authData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Login failed");
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      const data = response.data;

      let authData: { user: User; token: string };

      if (isNewAuthResponse(data) && data.data) {
        authData = data.data;
      } else if (isLegacyAuthResponse(data)) {
        authData = data;
      } else {
        throw new Error("Invalid response format");
      }

      localStorage.setItem("token", authData.token);
      localStorage.setItem("user", JSON.stringify(authData.user));
      return authData;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Registration failed"
      );
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Logout failed");
    }
  }
);

export const verifyToken = createAsyncThunk(
  "auth/verifyToken",
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyToken(token);
      const data = response.data;

      let verifyData: { valid: boolean; user: User };

      if (isNewVerifyResponse(data) && data.data) {
        verifyData = data.data;
      } else if (isLegacyVerifyResponse(data)) {
        verifyData = data;
      } else {
        throw new Error("Invalid response format");
      }

      if (!verifyData.valid) {
        throw new Error("Invalid token");
      }

      return verifyData;
    } catch (error: any) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return rejectWithValue(
        error.response?.data?.error || "Token verification failed"
      );
    }
  }
);

export const getProfile = createAsyncThunk(
  "auth/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getProfile();
      const data = response.data;

      let profileData: { user: User };

      if (isNewProfileResponse(data) && data.data) {
        profileData = data.data;
      } else if (isLegacyProfileResponse(data)) {
        profileData = data;
      } else {
        throw new Error("Invalid response format");
      }

      return profileData;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to get profile"
      );
    }
  }
);

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Verify Token
      .addCase(verifyToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyToken.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setLoading } = authSlice.actions;
export default authSlice.reducer;
