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
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <p className="text-xs font-medium uppercase leading-4 tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Platform appearance</p>
      <h1 className="mt-2 text-4xl font-bold leading-tight text-slate-950 dark:text-slate-50">Manage theme</h1>
      <p className="mt-3 text-base font-normal leading-6 text-slate-600 dark:text-slate-400">Update the values used by the platform-wide visual theme.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="mb-2 block text-sm font-medium leading-5 text-slate-700 dark:text-slate-300">Primary color</label>
          <Input name="primaryColor" value={formData.primaryColor || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium leading-5 text-slate-700 dark:text-slate-300">Secondary color</label>
          <Input name="secondaryColor" value={formData.secondaryColor || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium leading-5 text-slate-700 dark:text-slate-300">Background gradient</label>
          <Input name="backgroundGradient" value={formData.backgroundGradient || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium leading-5 text-slate-700 dark:text-slate-300">Font family</label>
          <Input name="fontFamily" value={formData.fontFamily || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium leading-5 text-slate-700 dark:text-slate-300">Logo URL</label>
          <Input name="logoUrl" value={formData.logoUrl || ""} onChange={handleChange} placeholder="/logo192.png or an image URL" />
          <p className="mt-2 text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">Use a public image URL or a path served by the app.</p>
        </div>
        <div className="flex justify-end">
          <Button type="submit">Update theme</Button>
        </div>
      </form>
    </div>
  );
};

export default ManageTheme;
