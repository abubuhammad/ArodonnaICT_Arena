// frontend/src/pages/ManageTheme.tsx
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ThemeContext, ThemeConfig } from "../context/ThemeContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router-dom";

const ManageTheme: React.FC = () => {
  const { theme, refreshTheme } = useContext(ThemeContext);
  const [formData, setFormData] = useState<Partial<ThemeConfig>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (theme) {
      setFormData(theme);
    }
  }, [theme]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Using theme?._id here; ensure ThemeConfig includes optional _id
      await axios.put(`/api/theme/${theme?._id}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      refreshTheme();
      alert("Theme updated successfully");
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Failed to update theme:", error);
      alert("Failed to update theme");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Theme</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Primary Color</label>
          <Input name="primaryColor" value={formData.primaryColor || ""} onChange={handleChange} />
        </div>
        <div>
          <label>Secondary Color</label>
          <Input name="secondaryColor" value={formData.secondaryColor || ""} onChange={handleChange} />
        </div>
        <div>
          <label>Background Gradient</label>
          <Input name="backgroundGradient" value={formData.backgroundGradient || ""} onChange={handleChange} />
        </div>
        <div>
          <label>Font Family</label>
          <Input name="fontFamily" value={formData.fontFamily || ""} onChange={handleChange} />
        </div>
        <Button type="submit">Update Theme</Button>
      </form>
    </div>
  );
};

export default ManageTheme;
