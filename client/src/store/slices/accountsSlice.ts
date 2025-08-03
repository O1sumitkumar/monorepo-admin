import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { accountsAPI, accountSharingAPI } from "../../services/api";
import type { Account, AccountSharing, Permission } from "../../services/api";

// Async thunks
export const fetchAccounts = createAsyncThunk(
  "accounts/fetchAccounts",
  async (params?: any) => {
    const response = await accountsAPI.getAll(params);
    return response.data?.data || [];
  }
);

export const createAccount = createAsyncThunk(
  "accounts/createAccount",
  async (accountData: Partial<Account>) => {
    const response = await accountsAPI.create(accountData);
    return response.data?.data;
  }
);

export const updateAccount = createAsyncThunk(
  "accounts/updateAccount",
  async ({ id, data }: { id: string; data: Partial<Account> }) => {
    const response = await accountsAPI.update(id, data);
    return response.data?.data;
  }
);

export const deleteAccount = createAsyncThunk(
  "accounts/deleteAccount",
  async (id: string) => {
    await accountsAPI.delete(id);
    return id;
  }
);

export const shareAccount = createAsyncThunk(
  "accounts/shareAccount",
  async ({
    id,
    data,
  }: {
    id: string;
    data: {
      targetAccountId: string;
      permissions: Permission[];
      expiresAt?: string;
    };
  }) => {
    const response = await accountsAPI.share(id, data);
    return response.data?.data;
  }
);

export const fetchAccountSharing = createAsyncThunk(
  "accounts/fetchAccountSharing",
  async (accountId?: string) => {
    const response = accountId
      ? await accountSharingAPI.getByAccount(accountId)
      : await accountSharingAPI.getAll();
    return response.data?.data || [];
  }
);

export const createAccountSharing = createAsyncThunk(
  "accounts/createAccountSharing",
  async (data: {
    sourceAccountId: string;
    targetAccountId: string;
    invitedBy: string;
    expiresAt?: string;
  }) => {
    const response = await accountSharingAPI.create(data);
    return response.data?.data;
  }
);

export const activateAccountSharing = createAsyncThunk(
  "accounts/activateAccountSharing",
  async (id: string) => {
    const response = await accountSharingAPI.activate(id);
    return response.data?.data;
  }
);

export const revokeAccountSharing = createAsyncThunk(
  "accounts/revokeAccountSharing",
  async (id: string) => {
    const response = await accountSharingAPI.revoke(id);
    return response.data?.data;
  }
);

// State interface
interface AccountsState {
  accounts: Account[];
  accountSharing: AccountSharing[];
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    active: number;
    inactive: number;
    shared: number;
  } | null;
}

const initialState: AccountsState = {
  accounts: [],
  accountSharing: [],
  loading: false,
  error: null,
  stats: null,
};

const accountsSlice = createSlice({
  name: "accounts",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAccounts: (state) => {
      state.accounts = [];
      state.accountSharing = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch accounts
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAccounts.fulfilled,
        (state, action: PayloadAction<Account[]>) => {
          state.loading = false;
          state.accounts = action.payload;
        }
      )
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch accounts";
      });

    // Create account
    builder
      .addCase(createAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createAccount.fulfilled,
        (state, action: PayloadAction<Account | undefined>) => {
          state.loading = false;
          if (action.payload) {
            state.accounts.unshift(action.payload);
          }
        }
      )
      .addCase(createAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create account";
      });

    // Update account
    builder
      .addCase(updateAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateAccount.fulfilled,
        (state, action: PayloadAction<Account | undefined>) => {
          state.loading = false;
          if (action.payload) {
            const index = state.accounts.findIndex(
              (acc) => acc.id === action.payload!.id
            );
            if (index !== -1) {
              state.accounts[index] = action.payload;
            }
          }
        }
      )
      .addCase(updateAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update account";
      });

    // Delete account
    builder
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteAccount.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.accounts = state.accounts.filter(
            (acc) => acc.id !== action.payload
          );
        }
      )
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete account";
      });

    // Share account
    builder
      .addCase(shareAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        shareAccount.fulfilled,
        (state, action: PayloadAction<AccountSharing | undefined>) => {
          state.loading = false;
          if (action.payload) {
            state.accountSharing.unshift(action.payload);
          }
        }
      )
      .addCase(shareAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to share account";
      });

    // Fetch account sharing
    builder
      .addCase(fetchAccountSharing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAccountSharing.fulfilled,
        (state, action: PayloadAction<AccountSharing[]>) => {
          state.loading = false;
          state.accountSharing = action.payload;
        }
      )
      .addCase(fetchAccountSharing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch account sharing";
      });

    // Create account sharing
    builder
      .addCase(createAccountSharing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createAccountSharing.fulfilled,
        (state, action: PayloadAction<AccountSharing | undefined>) => {
          state.loading = false;
          if (action.payload) {
            state.accountSharing.unshift(action.payload);
          }
        }
      )
      .addCase(createAccountSharing.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to create account sharing";
      });

    // Activate account sharing
    builder
      .addCase(activateAccountSharing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        activateAccountSharing.fulfilled,
        (state, action: PayloadAction<AccountSharing | undefined>) => {
          state.loading = false;
          if (action.payload) {
            const index = state.accountSharing.findIndex(
              (sharing) => sharing.id === action.payload!.id
            );
            if (index !== -1) {
              state.accountSharing[index] = action.payload;
            }
          }
        }
      )
      .addCase(activateAccountSharing.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to activate account sharing";
      });

    // Revoke account sharing
    builder
      .addCase(revokeAccountSharing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        revokeAccountSharing.fulfilled,
        (state, action: PayloadAction<AccountSharing | undefined>) => {
          state.loading = false;
          if (action.payload) {
            const index = state.accountSharing.findIndex(
              (sharing) => sharing.id === action.payload!.id
            );
            if (index !== -1) {
              state.accountSharing[index] = action.payload;
            }
          }
        }
      )
      .addCase(revokeAccountSharing.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to revoke account sharing";
      });
  },
});

export const { clearError, clearAccounts } = accountsSlice.actions;
export default accountsSlice.reducer;
