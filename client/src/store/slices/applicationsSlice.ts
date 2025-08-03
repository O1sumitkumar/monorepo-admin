import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { applicationsAPI } from "../../services/api";
import type { Application } from "../../services/api";

// Async thunks
export const fetchApplications = createAsyncThunk(
  "applications/fetchApplications",
  async (params?: any) => {
    const response = await applicationsAPI.getAll(params);
    return response.data?.data || [];
  }
);

export const createApplication = createAsyncThunk(
  "applications/createApplication",
  async (applicationData: Partial<Application>) => {
    const response = await applicationsAPI.create(applicationData);
    return response.data?.data;
  }
);

export const updateApplication = createAsyncThunk(
  "applications/updateApplication",
  async ({ id, data }: { id: string; data: Partial<Application> }) => {
    const response = await applicationsAPI.update(id, data);
    return response.data?.data;
  }
);

export const deleteApplication = createAsyncThunk(
  "applications/deleteApplication",
  async (id: string) => {
    await applicationsAPI.delete(id);
    return id;
  }
);

export const toggleApplicationStatus = createAsyncThunk(
  "applications/toggleStatus",
  async (id: string) => {
    const response = await applicationsAPI.toggleStatus(id);
    return response.data?.data;
  }
);

export const getActiveApplications = createAsyncThunk(
  "applications/getActive",
  async () => {
    const response = await applicationsAPI.getActive();
    return response.data?.data || [];
  }
);

// State interface
interface ApplicationsState {
  applications: Application[];
  activeApplications: Application[];
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    active: number;
    inactive: number;
  } | null;
}

const initialState: ApplicationsState = {
  applications: [],
  activeApplications: [],
  loading: false,
  error: null,
  stats: null,
};

const applicationsSlice = createSlice({
  name: "applications",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearApplications: (state) => {
      state.applications = [];
      state.activeApplications = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch applications
    builder
      .addCase(fetchApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchApplications.fulfilled,
        (state, action: PayloadAction<Application[]>) => {
          state.loading = false;
          state.applications = action.payload;
        }
      )
      .addCase(fetchApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch applications";
      });

    // Create application
    builder
      .addCase(createApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createApplication.fulfilled,
        (state, action: PayloadAction<Application | undefined>) => {
          state.loading = false;
          if (action.payload) {
            state.applications.unshift(action.payload);
          }
        }
      )
      .addCase(createApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create application";
      });

    // Update application
    builder
      .addCase(updateApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateApplication.fulfilled,
        (state, action: PayloadAction<Application | undefined>) => {
          state.loading = false;
          if (action.payload) {
            const index = state.applications.findIndex(
              (app) => app.id === action.payload!.id
            );
            if (index !== -1) {
              state.applications[index] = action.payload;
            }
          }
        }
      )
      .addCase(updateApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update application";
      });

    // Delete application
    builder
      .addCase(deleteApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteApplication.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.applications = state.applications.filter(
            (app) => app.id !== action.payload
          );
        }
      )
      .addCase(deleteApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete application";
      });

    // Toggle application status
    builder
      .addCase(toggleApplicationStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        toggleApplicationStatus.fulfilled,
        (state, action: PayloadAction<Application | undefined>) => {
          state.loading = false;
          if (action.payload) {
            const index = state.applications.findIndex(
              (app) => app.id === action.payload!.id
            );
            if (index !== -1) {
              state.applications[index] = action.payload;
            }
          }
        }
      )
      .addCase(toggleApplicationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to toggle application status";
      });

    // Get active applications
    builder
      .addCase(getActiveApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getActiveApplications.fulfilled,
        (state, action: PayloadAction<Application[]>) => {
          state.loading = false;
          state.activeApplications = action.payload;
        }
      )
      .addCase(getActiveApplications.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to fetch active applications";
      });
  },
});

export const { clearError, clearApplications } = applicationsSlice.actions;
export default applicationsSlice.reducer;
