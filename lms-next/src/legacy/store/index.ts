import { configureStore } from "@reduxjs/toolkit";
import enrollmentReducer from "./slices/enrollmentSlice";
import authReducer from "./slices/authSlice";

interface AuthState {
  user: any;
  adminUser: any;
  token: string | null;
  adminToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Helper function to safely get items from localStorage
const getLocalStorageItem = (key: string) => {
  const item = localStorage.getItem(key);
  if (!item) return null;
  try {
    return JSON.parse(item);
  } catch {
    return null;
  }
};

const preloadedState = {
  auth: {
    user: getLocalStorageItem("user"),
    adminUser: getLocalStorageItem("adminUser"),
    token: localStorage.getItem("token"),
    adminToken: localStorage.getItem("adminToken"),
    refreshToken: localStorage.getItem("refreshToken"),
    isAuthenticated: !!localStorage.getItem("token"),
    loading: false,
    error: null,
  } as AuthState,
};

const store = configureStore({
  reducer: {
    auth: authReducer,
    enrollment: enrollmentReducer,
  },
  preloadedState,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;