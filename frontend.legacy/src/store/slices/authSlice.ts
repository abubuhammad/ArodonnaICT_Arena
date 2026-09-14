import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { AdminUser, AdminLoginResponse, AdminLoginCredentials } from "../../types";
import api from '../../utils/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

interface User {
  _id: string;
  id: string;
  name: string;
  role: "student" | "instructor" | "admin" | "pending";
  email: string;
}

interface AuthState {
  user: User | null;
  adminUser: AdminUser | null;
  token: string | null;
  adminToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface RefreshTokenResponse {
  message: string;
  token: string;
  user: {
    _id: string;
    id: string;
    name: string;
    role: "student" | "instructor" | "admin" | "pending";
    email: string;
  };
}

// ✅ Load user and admin data safely from localStorage
const getLocalStorageItem = (key: string) => {
  const item = localStorage.getItem(key);
  console.log(`Loading ${key} from localStorage:`, item);
  
  if (!item || item === "undefined") {
    console.log(`No valid ${key} found in localStorage`);
    localStorage.removeItem(key); // Clean up invalid data
    return null;
  }
  try {
    const parsedItem = JSON.parse(item);
    console.log(`Successfully parsed ${key}:`, parsedItem);
    
    // Transform user data to ensure _id is set
    if (key === "user" && parsedItem) {
      return {
        ...parsedItem,
        _id: parsedItem.id || parsedItem._id,
        id: parsedItem.id || parsedItem._id
      };
    }
    
    // Normalize role to lowercase for consistency across app
    if (parsedItem && typeof parsedItem.role === 'string') {
      parsedItem.role = parsedItem.role.toLowerCase();
    }
    return parsedItem;
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage:`, error);
    localStorage.removeItem(key); // Clean up invalid data
    return null;
  }
};

const initialState: AuthState = {
  user: getLocalStorageItem("user"),
  adminUser: getLocalStorageItem("adminUser"),
  token: localStorage.getItem("token"),
  adminToken: localStorage.getItem("adminToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  error: null,
};


// ✅ Regular User Actions
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string }) => {
    const response = await axios.post(`${API_BASE_URL}/users/login`, credentials);
    console.log("Login response:", response.data);
    
    // Ensure user data has both id and _id
    const userData = {
      ...response.data.user,
      _id: response.data.user.id || response.data.user._id,
      id: response.data.user.id || response.data.user._id,
      role: (response.data.user.role || '').toString().toLowerCase()
    };
    
    console.log("Storing user data:", userData);
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(userData));
    
    return {
      token: response.data.token,
      user: userData
    };
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (credentials: { name: string; email: string; password: string; role: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/register`, credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "User registration failed");
    }
  }
);

// ✅ Admin Actions
export const loginAdmin = createAsyncThunk<
  { token: string; admin: AdminUser },
  AdminLoginCredentials
>(
  "auth/adminLogin",
  async (credentials, { rejectWithValue }) => {
    try {
      console.log("Attempting admin login with:", credentials.email);
      const response = await axios.post<AdminLoginResponse>(
        `${API_BASE_URL}/admin/admin-login`,
        credentials
      );
      
      console.log("Admin login response:", response.data);
      
      if (!response.data.admin || !response.data.token) {
        console.error("Invalid admin login response:", response.data);
        return rejectWithValue("Invalid admin login response");
      }

      // Ensure admin data has required fields
      const adminData: AdminUser = {
        _id: response.data.admin._id || response.data.admin.id,
        id: response.data.admin.id || response.data.admin._id,
        name: response.data.admin.name,
        email: response.data.admin.email,
        role: "admin"
      };
      
      console.log("Processed admin data:", adminData);
      
      // Store in localStorage
      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem("adminUser", JSON.stringify(adminData));
      
      return {
        token: response.data.token,
        admin: adminData
      };
    } catch (error: any) {
      console.error("Admin login error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Admin login failed");
    }
  }
);

export const registerAdmin = createAsyncThunk(
  "auth/adminRegister",
  async (credentials: { name: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/register-admin`, credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Admin registration failed");
    }
  }
);

// ✅ Request Instructor Role
export const requestInstructorRole = createAsyncThunk(
  "auth/requestInstructor",
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/instructor/request-instructor`, { userId });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Instructor request failed");
    }
  }
);

export const verifyAdminToken = createAsyncThunk(
  "auth/verifyAdminToken",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        return rejectWithValue("No admin token found");
      }

      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error: any) {
      // Clear admin data on unauthorized
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
      return rejectWithValue(error.response?.data?.message || "Token verification failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    logoutAdmin: (state) => {
      state.adminToken = null;
      state.adminUser = null;
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ User Login Handling
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.loading = false;
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ✅ Admin Login Handling
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.adminUser = action.payload.admin;
        state.adminToken = action.payload.token;
        state.loading = false;
        state.error = null;
        console.log("Admin login successful:", action.payload.admin);
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.adminUser = null;
        state.adminToken = null;
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        console.error("Admin login failed:", action.payload);
      })

      // ✅ Instructor Role Request Handling
      .addCase(requestInstructorRole.fulfilled, (state, action) => {
        if (state.user) {
          state.user.role = "pending";
        }
        localStorage.setItem("user", JSON.stringify(state.user));
      })

      // ✅ Refresh Token Handling
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.error = action.payload as string;
        // Clear invalid data
        state.token = null;
        state.user = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      })

      .addCase(verifyAdminToken.rejected, (state) => {
        state.adminToken = null;
        state.adminUser = null;
      });
  },
});

// Add refreshToken action at the top with other async thunks
export const refreshToken = createAsyncThunk<RefreshTokenResponse, void>(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/refresh-token`, {}, {
        withCredentials: true, // This is important for sending cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });
      // Update localStorage with the new token and user data
      const normalized = {
        ...response.data,
        user: {
          ...response.data.user,
          _id: response.data.user.id || response.data.user._id,
          id: response.data.user.id || response.data.user._id,
          role: (response.data.user.role || '').toString().toLowerCase()
        }
      };
      localStorage.setItem("token", normalized.token);
      localStorage.setItem("user", JSON.stringify(normalized.user));
      return normalized;
    } catch (error: any) {
      console.error("Token refresh failed:", error);
      return rejectWithValue(error.response?.data?.error || 'Token refresh failed');
    }
  }
);

// Make sure to export refreshToken along with other actions
export const { clearError, logoutUser, logoutAdmin } = authSlice.actions;
export default authSlice.reducer;
