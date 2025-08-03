import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import applicationsReducer from "./slices/applicationsSlice";
import rightsReducer from "./slices/rightsSlice";
import accountsReducer from "./slices/accountsSlice";
import usersReducer from "./slices/usersSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    applications: applicationsReducer,
    rights: rightsReducer,
    accounts: accountsReducer,
    users: usersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
