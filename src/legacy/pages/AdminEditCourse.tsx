import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

interface Course {
  _id: string;
  title: string;
  description: string;
  // add other course fields as needed
}

const AdminEditCourse: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await axios.get<Course>(`/api/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourse(res.data);
      } catch (err) {
        setError("Failed to fetch course details");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(`/api/courses/${courseId}`, course, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/admin/dashboard"); // redirect after update
    } catch (err) {
      setError("Failed to update course");
    }
  };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center bg-slate-50 p-6 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">Loading...</div>;
  if (error) return <div className="mx-auto mt-16 max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-200" role="alert">{error}</div>;
  if (!course) return <div className="mx-auto mt-16 max-w-2xl py-12 text-center text-sm text-slate-500 dark:text-slate-400">No course data found.</div>;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <p className="text-xs font-medium uppercase leading-4 tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Admin course tools</p>
      <h1 className="mt-2 text-4xl font-bold leading-tight text-slate-950 dark:text-slate-50">Edit course</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="mb-2 block text-sm font-medium leading-5 text-slate-700 dark:text-slate-300">Title</label>
          <Input
            value={course.title}
            onChange={(e) =>
              setCourse({ ...course, title: e.target.value })
            }
            placeholder="Course Title"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium leading-5 text-slate-700 dark:text-slate-300">Description</label>
          <textarea
            value={course.description}
            onChange={(e) =>
              setCourse({ ...course, description: e.target.value })
            }
            placeholder="Course Description"
            className="min-h-32 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm leading-5 text-slate-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
          />
        </div>
        {/* Add more fields as needed */}
        <div className="flex justify-end">
          <Button type="submit">Update course</Button>
        </div>
      </form>
    </div>
  );
};

export default AdminEditCourse;
