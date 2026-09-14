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
    <div className="min-h-screen flex flex-col bg-[#f4f1ea] text-[#18202b]">
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
 
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Category Filter */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a1732b]">Find your next chapter</p>
                <h3 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#18202b]">Browse by category</h3>
              </div>
              {!isAllSelected && (
                <button
                  onClick={clearCategories}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Dazzling container */}
            <div className="border-y border-[#d8d0c2] py-4 sm:py-5">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {/* All chip */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={clearCategories}
                  className={[
                    "px-4 sm:px-5 py-2 border text-sm sm:text-[0.95rem] font-semibold transition",
                    isAllSelected
                      ? "bg-[#18202b] text-white border-[#18202b]"
                      : "bg-transparent border-[#c9c0b1] text-[#4d5560] hover:border-[#18202b] hover:text-[#18202b]"
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
                        "px-4 sm:px-5 py-2 border text-sm sm:text-[0.95rem] font-semibold transition",
                        active
                          ? "bg-[#18202b] text-white border-[#18202b]"
                          : "bg-transparent border-[#c9c0b1] text-[#4d5560] hover:border-[#18202b] hover:text-[#18202b]"
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
          <section className="mb-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-semibold tracking-[-0.03em]">All Courses</h2>
              {selectedCategories.length > 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400">Filtered by {selectedCategories.length} categor{selectedCategories.length > 1 ? 'ies' : 'y'}</span>
              )}
            </div>
            {filteredCourses.length === 0 ? (
              <div className="rounded-2xl p-8 text-center bg-white/70 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800">
                <p className="text-gray-600 dark:text-gray-300">No courses found for the selected categories.</p>
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
          <section className="mb-20">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a1732b]">Curated for momentum</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Featured Courses</h2>
              </div>
              <button onClick={() => navigate('/courses')} className="hidden text-sm font-semibold text-[#8a6328] hover:text-[#18202b] sm:block">
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
