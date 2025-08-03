import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { rightsAPI } from "../../services/api";
import type { Rights, Permission } from "../../services/api";

// Async thunks
export const fetchRights = createAsyncThunk(
  "rights/fetchRights",
  async (params?: any) => {
    const response = await rightsAPI.getAll(params);
    return response.data?.data || [];
  }
);

export const createRights = createAsyncThunk(
  "rights/createRights",
  async (rightsData: {
    applicationId: string;
    accountId: string;
    permissions: Permission[];
    expiresAt?: string;
  }) => {
    const response = await rightsAPI.create(rightsData);
    return response.data?.data;
  }
);

export const updateRights = createAsyncThunk(
  "rights/updateRights",
  async ({ id, data }: { id: string; data: Partial<Rights> }) => {
    const response = await rightsAPI.update(id, data);
    return response.data?.data;
  }
);

export const deleteRights = createAsyncThunk(
  "rights/deleteRights",
  async (id: string) => {
    await rightsAPI.delete(id);
    return id;
  }
);

export const verifyRights = createAsyncThunk(
  "rights/verifyRights",
  async (data: {
    applicationId: string;
    accountId: string;
    permissions: Permission[];
  }) => {
    const response = await rightsAPI.verify(data);
    return response.data;
  }
);

// State interface
interface RightsState {
  rights: Rights[];
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    active: number;
    expired: number;
    byApplication: any[];
  } | null;
}

const initialState: RightsState = {
  rights: [],
  loading: false,
  error: null,
  stats: null,
};

const rightsSlice = createSlice({
  name: "rights",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearRights: (state) => {
      state.rights = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch rights
    builder
      .addCase(fetchRights.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchRights.fulfilled,
        (state, action: PayloadAction<Rights[]>) => {
          state.loading = false;
          state.rights = action.payload;
        }
      )
      .addCase(fetchRights.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch rights";
      });

    // Create rights
    builder
      .addCase(createRights.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createRights.fulfilled,
        (state, action: PayloadAction<Rights | undefined>) => {
          state.loading = false;
          if (action.payload) {
            state.rights.unshift(action.payload);
          }
        }
      )
      .addCase(createRights.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create rights";
      });

    // Update rights
    builder
      .addCase(updateRights.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateRights.fulfilled,
        (state, action: PayloadAction<Rights | undefined>) => {
          state.loading = false;
          if (action.payload) {
            const index = state.rights.findIndex(
              (right) => right.id === action.payload!.id
            );
            if (index !== -1) {
              state.rights[index] = action.payload;
            }
          }
        }
      )
      .addCase(updateRights.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update rights";
      });

    // Delete rights
    builder
      .addCase(deleteRights.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteRights.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.rights = state.rights.filter(
            (right) => right.id !== action.payload
          );
        }
      )
      .addCase(deleteRights.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete rights";
      });

    // Verify rights
    builder
      .addCase(verifyRights.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyRights.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // Handle verification result
      })
      .addCase(verifyRights.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to verify rights";
      });
  },
});

export const { clearError, clearRights } = rightsSlice.actions;
export default rightsSlice.reducer;
