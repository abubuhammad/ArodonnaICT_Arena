import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { logoutUser } from "../store/slices/authSlice";
import { RootState, AppDispatch } from "../store";
import { Course, User } from "../types";
import api from "../utils/api";

// Components
import Navigation from "../components/layout/Navigation";
import Footer from "../components/layout/Footer";
import HeroSection from "../components/sections/HeroSection";
import StatsSection from "../components/sections/StatsSection";
import CourseCard from "../components/courses/CourseCard";
import CourseCardSmall from "../components/courses/CourseCardSmall";
import Testimonials from "../components/sections/Testimonials";
import LogoMarquee from "../components/sections/LogoMarquee";
import CTABand from "../components/sections/CTABand";

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth as { user: User | null });
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [platformSharePercent, setPlatformSharePercent] = useState(20);

  const handleLogout = () => {
    dispatch(logoutUser());
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
    if (!courseId) {
      alert('Missing course id. Please refresh.');
      return;
    }
    navigate(`/courses/${courseId}/enroll`);
  };

  // For public (unauthenticated) visitors
  useEffect(() => {
    if (user) return;
    let cancelled = false;
    const fetchPublicCourses = async () => {
      try {
        const response = await api.get("/courses/public");
        if (cancelled) return;
        const data = Array.isArray(response.data) ? response.data : [];
        const processedCourses = data.map((course: any) => ({
          ...course,
          _id: course._id || course.id, // ensure _id for UI keys/components
          // keep instructor object intact (do not coerce to name string)
          instructor: course.instructor,
          level: course.level || "N/A",
          duration: course.duration || "N/A",
        }));
        setCourses(processedCourses);
        setFeaturedCourses(processedCourses.slice(0, 3));
        const uniqueCategories = [...new Set(processedCourses.map((course: Course) => course.category))].filter((category): category is string => typeof category === 'string');
        setCategories(uniqueCategories);
      } catch (error: any) {
        if (cancelled) return;
        console.error("Error fetching public courses:", error);
        // Gracefully handle network/server errors by showing an empty state instead of a hard error
        setCourses([]);
        setFeaturedCourses([]);
        // Only show banner for network errors
        if (error?.code === 'ERR_NETWORK') {
          setErrorMessage("Unable to load courses. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPublicCourses();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // For authenticated users
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const normalizeCourse = (course: any) => {
          const category =
            (course?.category && typeof course.category === "object"
              ? course.category.name || course.category.title || course.category._id
              : course?.category) || "Uncategorized";
          return { ...course, category };
        };

        if (user?.role === "student") {
          const { data } = await api.get("/courses");
          setCourses(Array.isArray(data) ? data.map(normalizeCourse) : []);
        } else if (user?.role === "instructor") {
          const instructorId = (user as any).id || (user as any)._id;
          const { data } = await api.get(`/courses?instructor=${instructorId}`);
          setCourses(Array.isArray(data) ? data.map(normalizeCourse) : []);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setErrorMessage("Failed to load courses. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchCourses();
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role !== "instructor") return;
    api.get("/courses/settings")
      .then((response) => setPlatformSharePercent(Number(response.data?.platformSharePercent ?? 20)))
      .catch((error) => console.error("Error fetching platform settings:", error));
  }, [user]);

  // Fetch categories (for filtering)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        const data = Array.isArray(response.data) ? response.data : [];
        setCategories(data.map((c: any) => c?.name || c).filter(Boolean));
      } catch (error: any) {
        console.error("Error fetching categories:", error);
        // Gracefully fallback to empty list without forcing login flow
        setCategories([]);
        if (error?.code === 'ERR_NETWORK') {
          setErrorMessage("Unable to load categories. Please try again later.");
        }
      }
    };
    fetchCategories();
  }, [dispatch, navigate]);

  // Category filter helpers
  const isAllSelected = selectedCategories.length === 0;
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };
  const clearCategories = () => setSelectedCategories([]);

  // Filter courses by selected categories.
  const filteredCourses: Course[] = courses.filter((course: Course) =>
    selectedCategories.length === 0 || selectedCategories.includes(course.category)
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <Navigation
        user={user}
        onLogout={handleLogout}
        onDashboardNavigation={handleDashboardNavigation}
      />

      {/* Public Landing Content */}
      <HeroSection
        title="Transform Your Tech Career"
        description="Join our platform to master in-demand skills."
        primaryButtonText="Explore Courses"
        secondaryButtonText="Learn More"
        onPrimaryClick={() => navigate('/courses')}
        onSecondaryClick={() => navigate('/about')}
        imageUrl="/images/mainhero.jpeg"  // Use public root path and forward slashes
      />

      <StatsSection />

      {/* Logo Marquee */}
      <LogoMarquee />

      {/* Testimonials */}
      <Testimonials />
 
      <section className="py-16">
        <div className="mx-auto w-full max-w-7xl space-y-8 px-6">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-200" role="alert">
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  <svg className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p>{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Category Filter */}
          <div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase leading-4 tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Find your next chapter</p>
                <h3 className="mt-2 text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Browse by category</h3>
              </div>
              {!isAllSelected && (
                <button
                  onClick={clearCategories}
                  className="text-sm font-medium leading-5 text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Dazzling container */}
            <div className="border-y border-slate-200 py-4 dark:border-slate-800">
              <div className="flex flex-wrap gap-2">
                {/* All chip */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={clearCategories}
                  className={[
                    "h-10 rounded-lg border px-3 text-sm font-medium leading-5 transition-colors",
                    isAllSelected
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 bg-transparent text-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-indigo-400"
                  ].join(" ")}
                >
                  All
                </motion.button>

                {/* Category chips */}
                {categories.map((cat) => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <motion.button
                      key={cat}
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleCategory(cat)}
                      className={[
                        "h-10 rounded-lg border px-3 text-sm font-medium leading-5 transition-colors",
                        active
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-300 bg-transparent text-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-indigo-400"
                      ].join(" ")}
                    >
                      {cat}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* All Courses - directly under Browse by Categories for immediate filtering */}
          <section>
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">All Courses</h2>
              {selectedCategories.length > 0 && (
                <span className="text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">Filtered by {selectedCategories.length} categor{selectedCategories.length > 1 ? 'ies' : 'y'}</span>
              )}
            </div>
            {filteredCourses.length === 0 ? (
              <div className="py-12 text-center">
                <h3 className="text-lg font-semibold leading-7 text-slate-950 dark:text-slate-50">No courses found</h3>
                <p className="mt-2 text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">Try another category or clear the current filters.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((course: any) => (
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
          </section>

          {/* Featured Courses */}
          <section>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase leading-4 tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Curated for momentum</p>
                <h2 className="mt-2 text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Featured Courses</h2>
              </div>
              <button onClick={() => navigate('/courses')} className="hidden text-sm font-medium leading-5 text-indigo-600 hover:text-indigo-700 sm:block dark:text-indigo-400">
                View all -&gt;
              </button>
            </div>
            {/* Carousel on wide screens; grid fallback via CSS overflow */}
            <div className="hidden md:block">
              {/* lightweight inline carousel using overflow-x */}
              <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-2">
                {featuredCourses.map((course: Course) => (
                  <div key={(course as any)._id || (course as any).id} className="min-w-[320px] max-w-[340px] snap-start">
                    <CourseCard
                      key={(course as any)._id || (course as any).id}
                      course={course as any}
                      onEnroll={handleEnrollment}
                      isAuthenticated={!!user}
                      currentUserRole={user?.role || "student"}
                      currentUserId={(user as any)?.id || (user as any)?._id || ""}
                      locale={(user as any)?.locale}
                      currencyCode={(user as any)?.currency}
                      platformSharePercent={platformSharePercent}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="md:hidden grid grid-cols-1 gap-6">
              {featuredCourses.map((course: Course) => (
                <CourseCard
                  key={(course as any)._id || (course as any).id}
                  course={course as any}
                  onEnroll={handleEnrollment}
                  isAuthenticated={!!user}
                  currentUserRole={user?.role || "student"}
                  currentUserId={(user as any)?.id || (user as any)?._id || ""}
                  locale={(user as any)?.locale}
                  currencyCode={(user as any)?.currency}
                  platformSharePercent={platformSharePercent}
                />
              ))}
            </div>
          </section>

          {/* CTA Band */}
          <CTABand
            onPrimary={() => navigate('/courses')}
            onSecondary={() => navigate('/instructor/request')}
          />
        </div>
      </section>

      {/* Additional Views for Authenticated Users */}
      {user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-grow py-12"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                {user.role === "student" && (
                  <div className="space-y-8">
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Available Courses</h2>
                      <div className="grid md:grid-cols-3 gap-6">
                        {courses.map((course: Course) => (
                          <CourseCard
                            key={course._id}
                            course={course}
                            onEnroll={handleEnrollment}
                            isAuthenticated={true}
                            currentUserRole={user.role}
                            currentUserId={user._id}
                            locale={(user as any)?.locale}
                            currencyCode={(user as any)?.currency}
                            platformSharePercent={platformSharePercent}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {user.role === "instructor" && (
                  <div className="space-y-8">
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-gray-800">My Courses</h2>
                        <button
                          onClick={() => navigate("/create-course")}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                        >
                          Create New Course
                        </button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-6">
                        {courses.map((course: Course) => (
                          <CourseCard
                            key={course._id}
                            course={course}
                            onEnroll={() => navigate(`/instructor/edit-course/${course._id}`)}
                            isAuthenticated={true}
                            currentUserRole={user.role}
                            currentUserId={user._id}
                            locale={(user as any)?.locale}
                            currencyCode={(user as any)?.currency}
                            showInstructorEarnings={false}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

{user?.role === "admin" && (
  <div className="space-y-8">
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Admin Dashboard</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Course Management",
            description: "Manage all courses and their content",
            link: "/admin/courses",
          },
          {
            title: "User Management",
            description: "Manage students and instructors",
            link: "/admin/users",
          },
          {
            title: "Manage Categories",
            description: "Manage dynamic course categories",
            link: "/admin/manage-categories",
          },
          {
            title: "Theme Management",
            description: "Change the look and feel of the application",
            link: "/admin/manage-theme",
          },
          {
            title: "Analytics",
            description: "View platform statistics and reports",
            link: "/admin/analytics",
          },
        ].map((item, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 border">
            <h3 className="text-lg font-semibold mb-4">{item.title}</h3>
            <p className="text-gray-600 mb-4">{item.description}</p>
            <button
              onClick={() => navigate(item.link)}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              View {item.title.split(" ")[0]}
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

              </>
            )}
          </div>
        </motion.div>
      )}

      <Footer />
    </div>
  );
};

export default Dashboard;
