import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const AdminSignup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("/api/admin/register-admin", formData, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      if (response.status === 201) {
        navigate("/admin/login");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Create Admin Account</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {loading ? "Creating Account..." : "Create Admin Account"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminSignup;
