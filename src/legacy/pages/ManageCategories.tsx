import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import { FolderPlus, Trash2, ArrowLeft, Search } from "lucide-react";

interface Category {
  id: string; // prisma uses `id`
  name: string;
}

const ManageCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const adminToken = localStorage.getItem("adminToken");

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory) return;
    try {
      setLoading(true);
      await axios.post(
        "/api/categories",
        { name: newCategory },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setNewCategory("");
      fetchCategories();
    } catch (error) {
      console.error("Failed to add category", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      setLoading(true);
      await axios.delete(`/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      fetchCategories();
    } catch (error) {
      console.error("Failed to delete category", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm) return categories;
    const q = searchTerm.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchTerm]);

  return (
    <DashboardLayout activeItem="categories" adminUser={{ name: "Admin" }}>
      <div className="py-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Manage Categories</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Create, search, and delete course categories.</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/dashboard")} className="inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Dashboard
          </Button>
        </div>

        <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            <label className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories"
                className="pl-9"
                aria-label="Search categories"
              />
            </label>
            <div className="flex w-full gap-2 lg:w-auto">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name"
                aria-label="New category name"
              />
              <Button onClick={handleAddCategory} disabled={loading} className="inline-flex items-center gap-2">
                <FolderPlus size={16} /> Add
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70">
            {loading ? (
              <div className="p-4"><SkeletonLoader lines={4} /></div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                <AnimatePresence>
                  {filtered.map((cat) => (
                    <motion.li
                      key={cat.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{cat.name}</p>
                        <p className="text-xs text-slate-500">ID: {cat.id}</p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="inline-flex items-center gap-2"
                        aria-label={`Delete category ${cat.name}`}
                      >
                        <Trash2 size={14} /> Delete
                      </Button>
                    </motion.li>
                  ))}
                  {filtered.length === 0 && (
                    <li className="px-4 py-6 text-sm text-slate-500">No categories found.</li>
                  )}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageCategories;
