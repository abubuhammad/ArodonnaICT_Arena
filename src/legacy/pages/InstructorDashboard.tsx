import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, PlusCircle } from "lucide-react";
import api from "../utils/api";
import { logoutUser } from "../store/slices/authSlice";
import { RootState } from "../store";
import { Tabs } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import CourseCard from "../components/courses/CourseCard";
import { StatCard } from "../components/ui/StatCard";
import {
  UsersIcon,
  BookOpenIcon,
  ChartBarIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";

// Instructor Components
import DashboardHeader from "../components/instructor/DashboardHeader";
import StatsGrid from "../components/instructor/StatsGrid";
import CoursePerformance from "../components/instructor/CoursePerformance";
import RecentActivities from "../components/instructor/RecentActivities";
import InstructorRequestSection from "../components/instructor/InstructorRequestSection";
import InstructorProfile from "../components/instructor/InstructorProfile";
import EarningsCard from "../components/instructor/EarningsCard";
import InstructorOnboarding from "../components/instructor/InstructorOnboarding";

// UI Components
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import { Button } from "../components/ui/button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface InstructorStats {
  totalStudents: number;
  totalCourses: number;
  completionRate: number;
  activeEnrollments: number;
  averageRating: number;
  totalRevenue: number;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  isFree: boolean;
  enrolledStudents: string[];
  instructor: {
    name: string;
    title?: string;
    avatar?: string;
  };
  thumbnail?: string;
  status?: string;
}

interface EnrollmentProgress {
  enrollmentId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  courseId: string;
  enrolledAt: string;
  progress: {
    status: "completed" | "in-progress" | "not-started";
    completedLessons: number;
    totalLessons: number;
  };
}

interface ApiError {
  response?: {
    status: number;
    data?: any;
  };
  message: string;
}

type TabType = "overview" | "courses" | "students" | "analytics";

const getCourseStatus = (course: Course) => {
  const status = String(course.status || "DRAFT").toUpperCase();
  if (status === "PUBLISHED") return { label: "Published", variant: "success" as const };
  if (status === "REVIEW" || status === "QA") return { label: "In review", variant: "warning" as const };
  return { label: "Draft", variant: "secondary" as const };
};

const InstructorDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);
  // derive safe locale and currency values — user may not have these properties
  const userLocale = (user && (user as any).locale) || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
  const userCurrency = (user && (user as any).currency) || undefined;
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<InstructorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentProgress, setEnrollmentProgress] = useState<EnrollmentProgress[]>([]);
  const [instructorStatus, setInstructorStatus] = useState<"approved" | "pending" | "none">("none");
  const [earnings, setEarnings] = useState<any>({ totalInstructorEarnings: 0, totalPlatformEarnings: 0, courses: [] });
  const [platformSharePercent, setPlatformSharePercent] = useState<number>(20);
  const [instructorProfile, setInstructorProfile] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const tabs: TabType[] = ["overview", "courses", "students", "analytics"];

  const handleTabChange = useCallback((tab: string) => {
    if (isValidTab(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const isValidTab = (tab: string): tab is TabType => {
    return tabs.includes(tab as TabType);
  };

  // Get token from localStorage if not in Redux state
  const getAuthToken = useCallback(() => {
    if (token) return token;
    
    try {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        console.log("Retrieved token from localStorage");
        return storedToken;
      }
      console.log("No token found in localStorage");
      return null;
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return null;
    }
  }, [token]);

  // Fetch instructor dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      console.log("No user ID available for fetching dashboard data");
      return;
    }

    const authToken = getAuthToken();
    if (!authToken) {
      console.log("No auth token available");
      setError("Authentication token missing. Please log in again.");
      dispatch(logoutUser());
      navigate("/login");
      return;
    }
    
    try {
      console.log("Fetching dashboard data for user:", user.id);
      setLoading(true);

      console.log("Making API requests for dashboard data");

      const [statsResponse, coursesResponse, progressResponse, earningsResponse, platformResponse, profileResponse] = await Promise.all([
        api.get(`/instructors/stats/${user.id}`),
        api.get(`/instructors/courses/${user.id}`),
        api.get(`/instructors/enrollment-progress/${user.id}`),
        api.get(`/instructors/earnings/${user.id}`),
        api.get(`/courses/settings`),
        api.get(`/instructors/onboarding/profile/${user.id}`)
      ]);

      console.log("Dashboard data responses:", {
        stats: statsResponse.data,
        courses: coursesResponse.data,
        progress: progressResponse.data,
        profile: profileResponse.data
      });

      setStats(statsResponse.data);
      setCourses(coursesResponse.data);
      setEnrollmentProgress(progressResponse.data);
      
      // store instructor profile (with locale/currency)
      const profile = profileResponse.data;
      setInstructorProfile(profile);
      
      // check if onboarding is completed
      if (!profile.onboardingCompleted) {
        setShowOnboarding(true);
        return;
      }
      
      // store earnings in state and pass to component
      const earnings = earningsResponse.data || { totalInstructorEarnings: 0, totalPlatformEarnings: 0, courses: [] };
      setEarnings(earnings);
      // platform settings
      setPlatformSharePercent(platformResponse.data?.platformSharePercent ?? 20);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error("Error fetching dashboard data:", apiError);
      console.error("Error details:", {
        status: apiError.response?.status,
        data: apiError.response?.data,
        message: apiError.message
      });

      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        console.log("Authentication error - logging out");
        dispatch(logoutUser());
        navigate("/login");
        return;
      }
      setError("Failed to load dashboard data. Please try logging out and back in.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, getAuthToken, dispatch, navigate]);

  const checkInstructorStatus = useCallback(async () => {
    if (!user?.id) {
      console.log("No user ID available");
      return;
    }

    // If user is already an instructor, skip the request-status check
    if (user.role === "instructor") {
      console.log("User is already an instructor, skipping status check");
      setInstructorStatus("approved");
      setLoading(false);
      return;
    }

    const authToken = getAuthToken();
    if (!authToken) {
      console.log("No auth token available for status check");
      dispatch(logoutUser());
      navigate("/login");
      return;
    }

    try {
      console.log("Checking instructor status for user:", user.id);
      setLoading(true);
      
      const response = await api.get(`/instructors/request-status`);
      console.log("Instructor status response:", response.data);
      setInstructorStatus(response.data.status);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error("Error checking instructor status:", apiError);
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        console.log("Authentication error - logging out");
        dispatch(logoutUser());
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role, getAuthToken, dispatch, navigate]);

  // Delete a course
  const deleteCourse = async (courseId: string) => {
    try {
      await api.delete(`/courses/${courseId}`);
      setCourses(prev => prev.filter(course => course._id !== courseId));
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  // Navigate to instructor edit page
  const editCourse = (courseId: string) => {
    navigate(`/instructor/edit-course/${courseId}`);
  };

  const requestInstructorRole = async () => {
    if (!user?.id) {
      console.log("No user ID available for requesting instructor role");
      return;
    }

    try {
      console.log("Requesting instructor role for user:", user.id);
      setLoading(true);
      await api.post(`/instructors/request-instructor`, { userId: user.id });
      setInstructorStatus("pending");
    } catch (error) {
      console.error("Error requesting instructor role:", error);
      setError("Failed to submit instructor request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
    checkInstructorStatus();
    }
  }, [user?.id, checkInstructorStatus]);

  useEffect(() => {
    if (instructorStatus === "approved") {
      fetchDashboardData();
    }
  }, [instructorStatus, fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!user) {
    return <ErrorMessage message="Please log in to access the instructor dashboard" />;
  }

  // If user is an instructor, show the dashboard or onboarding
  if (user.role === "instructor") {
    // Show onboarding if not completed
    if (showOnboarding && user.id) {
      return (
        <div className="container mx-auto px-4 py-8">
          <InstructorOnboarding
            userId={user.id}
            onComplete={() => {
              setShowOnboarding(false);
              fetchDashboardData();
            }}
          />
        </div>
      );
    }

  return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Main Dashboard
            </Button>
            <div>
              <p className="text-xs font-medium uppercase leading-4 tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Instructor workspace</p>
              <h1 className="mt-1 text-4xl font-bold leading-tight text-slate-950 dark:text-slate-50">Instructor Dashboard</h1>
            </div>
          </div>
        </div>
        
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          className="mb-8"
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Students"
                value={stats?.totalStudents || 0}
                icon={<UsersIcon className="h-6 w-6" />}
              />
              <StatCard
                title="Total Courses"
                value={stats?.totalCourses || 0}
                icon={<BookOpenIcon className="h-6 w-6" />}
              />
              <StatCard
                title="Completion Rate"
                value={`${stats?.completionRate || 0}%`}
                icon={<ChartBarIcon className="h-6 w-6" />}
              />
              <StatCard
                title="Total Revenue"
                value={`$${stats?.totalRevenue || 0}`}
                icon={<CurrencyDollarIcon className="h-6 w-6" />}
              />
      </div>
          )}

          {activeTab === 'overview' && (
            <div className="mt-6">
              <EarningsCard
                totalInstructorEarnings={earnings.totalInstructorEarnings || 0}
                totalPlatformEarnings={earnings.totalPlatformEarnings || 0}
                courses={earnings.courses || []}
                locale={instructorProfile?.locale}
                currencyCode={instructorProfile?.currency}
              />
            </div>
          )}

          {activeTab === "courses" && (
            <>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Course management</h2>
                  <p className="mt-1 text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">Review, edit, and publish your course catalogue.</p>
                </div>
                <Button
                  onClick={() => navigate("/instructor/create-course")}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create New Course
                    </Button>
                  </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <div key={course._id} className="relative">
                    <Badge variant={getCourseStatus(course).variant} className="absolute right-3 top-3 z-10 shadow-sm">
                      {getCourseStatus(course).label}
                    </Badge>
                    <CourseCard
                      course={course as any}
                      enrollments={[]}
                      onEnroll={() => navigate(`/instructor/edit-course/${course._id}`)}
                      isAuthenticated={true}
                      currentUserRole="instructor"
                      currentUserId={user?.id || ""}
                      platformSharePercent={platformSharePercent}
                      locale={instructorProfile?.locale}
                      currencyCode={instructorProfile?.currency}
                    />
                  </div>
                ))}
              </div>
        </>
          )}

          {activeTab === "students" && (
            <div className="space-y-6">
              {/* Add students tab content here */}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* Add analytics tab content here */}
            </div>
          )}
        </Tabs>
      </div>
    );
  }

  // Only show the request section if user is not an instructor
  if (instructorStatus !== "approved") {
    return (
        <InstructorRequestSection
          instructorStatus={instructorStatus}
          requestInstructorRole={requestInstructorRole}
        />
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-16">
      <p className="text-xs font-medium uppercase leading-4 tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Instructor workspace</p>
      <h1 className="mt-2 mb-8 text-4xl font-bold leading-tight text-slate-950 dark:text-slate-50">Instructor Dashboard</h1>
      
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className="mb-8"
      >
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Students"
              value={stats?.totalStudents || 0}
              icon={<UsersIcon className="h-6 w-6" />}
            />
            <StatCard
              title="Total Courses"
              value={stats?.totalCourses || 0}
              icon={<BookOpenIcon className="h-6 w-6" />}
            />
            <StatCard
              title="Completion Rate"
              value={`${stats?.completionRate || 0}%`}
              icon={<ChartBarIcon className="h-6 w-6" />}
            />
            <StatCard
              title="Total Revenue"
              value={`$${stats?.totalRevenue || 0}`}
              icon={<CurrencyDollarIcon className="h-6 w-6" />}
            />
          </div>
        )}

        {activeTab === "courses" && (
          <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Course management</h2>
            <p className="mt-1 text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">Review, edit, and publish your course catalogue.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div key={course._id} className="relative">
                <Badge variant={getCourseStatus(course).variant} className="absolute right-3 top-3 z-10 shadow-sm">
                  {getCourseStatus(course).label}
                </Badge>
                <CourseCard
                  course={course as any}
                  enrollments={[]}
                  onEnroll={() => navigate(`/instructor/edit-course/${course._id}`)}
                  isAuthenticated={true}
                  currentUserRole="instructor"
                  currentUserId={user?.id || ""}
                />
              </div>
            ))}
          </div>
          </>
        )}

        {activeTab === "students" && (
          <div className="space-y-6">
            {/* Add students tab content here */}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Add analytics tab content here */}
          </div>
        )}
      </Tabs>
    </div>
  );
};

export default InstructorDashboard;
