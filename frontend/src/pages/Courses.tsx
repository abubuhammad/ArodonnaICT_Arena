import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RootState } from "../store";
import { Course, User } from "../types";
import api from "../utils/api";

// Components
import Navigation from "../components/layout/Navigation";
import Footer from "../components/layout/Footer";
import CourseCardSmall from "../components/courses/CourseCardSmall";
import SearchBar from "../components/ui/SearchBar";
import SkeletonCourse from "../components/ui/SkeletonCourse";

const PAGE_SIZE = 9;

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth as { user: User | null });
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // UI controls
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleLogout = () => {
    navigate("/login");
  };

  const handleDashboardNavigation = () => {
    if (user?.role === "admin") {
      navigate("/admin/dashboard");
    } else if (user?.role === "instructor") {
      navigate("/instructor/dashboard");
    } else if (user?.role === "student") {
      navigate("/student/dashboard");
    }
  };

  const handleEnrollment = (courseId: string) => {
    if (!courseId) return;
    navigate(`/courses/${courseId}/enroll`);
  };

  // Fetch public courses and categories
  useEffect(() => {
    let mounted = true;
    const fetchPublicCourses = async () => {
      setLoading(true);
      try {
        const response = await api.get("/courses/public");
        const data = Array.isArray(response.data) ? response.data : [];
        const processedCourses = data.map((course: any) => ({
          ...course,
          _id: course._id || course.id,
          instructor: course.instructor,
          level: course.level || "N/A",
          duration: course.duration || "N/A",
        }));
        if (!mounted) return;
        setCourses(processedCourses);
        const uniqueCategories = [...new Set(processedCourses.map((course: any) => course.category))].filter(Boolean) as string[];
        setCategories(uniqueCategories);
      } catch (error: any) {
        console.error("Error fetching public courses:", error);
        setCourses([]);
        setCategories([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPublicCourses();
    return () => { mounted = false; };
  }, []);

  // Category helpers
  const isAllSelected = selectedCategories.length === 0;
  const toggleCategory = (cat: string) => {
    setPage(1);
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };
  const clearCategories = () => { setSelectedCategories([]); setPage(1); };

  // Filter + search + sort
  const filtered = useMemo(() => {
    let out = courses.slice();
    if (selectedCategories.length > 0) {
      out = out.filter((c: any) => selectedCategories.includes(c.category));
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      out = out.filter((c: any) => (c.title || "").toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q));
    }
    if (sortBy === "price_asc") out.sort((a: any, b: any) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (sortBy === "price_desc") out.sort((a: any, b: any) => (Number(b.price) || 0) - (Number(a.price) || 0));
    if (sortBy === "newest") out.sort((a: any, b: any) => (new Date(b.createdAt || b._createdAt || Date.now()).getTime()) - (new Date(a.createdAt || a._createdAt || Date.now()).getTime()));
    return out;
  }, [courses, selectedCategories, debouncedSearch, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages]);

  const displayed = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto w-full px-4 pt-4">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
          className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
        >
          ← Back
        </button>
      </div>
      <Navigation
        user={user}
        onLogout={handleLogout}
        onDashboardNavigation={handleDashboardNavigation}
      />

      <main className="py-12 flex-grow">
        <div className="max-w-7xl mx-auto px-4">
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-2">All Courses</h1>
            <p className="text-gray-600 dark:text-gray-400">Browse our comprehensive course catalog. Use search and filters to find the right course.</p>
          </header>

          {/* Controls: search, sort, category chips */}
          <div className="mb-6 grid gap-4 md:grid-cols-3 items-center">
            <div className="md:col-span-2">
              <label htmlFor="search" className="sr-only">Search courses</label>
              <SearchBar
                id="search"
                value={search}
                onChange={(val) => { setSearch(val); setPage(1); }}
                placeholder="Search courses by title or description..."
              />
            </div>

            <div className="flex gap-3 items-center">
              <label htmlFor="sort" className="text-sm text-gray-600 dark:text-gray-400">Sort</label>
              <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="rounded-lg border px-3 py-2 dark:bg-gray-800 dark:border-gray-600">
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
              </select>
            </div>
          </div>

          <section aria-labelledby="browse-heading" className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 id="browse-heading" className="text-xl font-bold">Browse by category</h2>
              {!isAllSelected && (
                <button onClick={clearCategories} className="text-sm text-indigo-600 hover:underline">Clear</button>
              )}
            </div>
            <div className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-800 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <motion.button whileHover={{ scale: 1.02 }} onClick={clearCategories} className={["px-4 py-2 rounded-full text-sm font-medium transition", isAllSelected ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800 border"] .join(' ')}>All</motion.button>
                {categories.map((cat) => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <button key={cat} onClick={() => toggleCategory(cat)} className={["px-4 py-2 rounded-full text-sm font-medium transition", active ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800 border"] .join(' ')}>{cat}</button>
                  );
                })}
              </div>
            </div>
          </section>

          <section aria-live="polite">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">{selectedCategories.length === 0 ? 'All Courses' : 'Filtered Courses'}</h3>
              <div className="text-sm text-gray-600">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</div>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SkeletonCourse count={PAGE_SIZE} />
              </div>
            ) : displayed.length === 0 ? (
              <div className="rounded-2xl p-12 text-center bg-white/70 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800">
                <p className="text-gray-600 dark:text-gray-300 text-lg">No courses match your filters.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayed.map((course: any) => (
                  <CourseCardSmall
                    key={course._id || course.id}
                    course={{
                      _id: course._id || course.id,
                      title: course.title,
                      description: course.description,
                      price: course.price,
                      isFree: course.isFree,
                      instructor: course.instructor,
                      level: course.level || 'Beginner',
                      duration: course.duration || 'N/A',
                      thumbnail: course.thumbnail,
                    }}
                    onEnroll={handleEnrollment}
                    onViewCourse={(courseId) => navigate(`/courses/${courseId}`)}
                    locale={(user as any)?.locale}
                    currencyCode={(user as any)?.currency}
                    currentUserId={(user as any)?.id || (user as any)?._id}
                    currentUserRole={user?.role}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && filtered.length > PAGE_SIZE && (
              <div className="mt-8 flex justify-center items-center gap-3">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border">Prev</button>
                <span className="text-sm">Page {page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded border">Next</button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CoursesPage;
