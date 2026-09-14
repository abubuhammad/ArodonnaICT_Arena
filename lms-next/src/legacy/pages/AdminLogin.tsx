import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginAdmin } from "../store/slices/authSlice";
import { RootState, AppDispatch } from "../store";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const AdminLogin: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, adminUser, adminToken } = useSelector((state: RootState) => state.auth);

  // Check if already logged in
  useEffect(() => {
    if (adminUser && adminToken) {
      console.log("Admin already logged in, redirecting to dashboard");
      navigate('/admin/dashboard');
    }
  }, [adminUser, adminToken, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Attempting admin login...");
      const result = await dispatch(loginAdmin(formData)).unwrap();
      console.log("Login result:", result);
      
      if (result.admin && result.token) {
        console.log("Admin login successful, redirecting to dashboard");
        navigate('/admin/dashboard');
      } else {
        console.error("Invalid login result:", result);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Admin Login</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="Enter admin email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="Enter password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Login as Admin"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
