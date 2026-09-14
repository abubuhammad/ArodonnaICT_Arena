import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "./store";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import AdminEditCourse from "./pages/AdminEditCourse"; // new admin edit component
import InstructorDashboard from "./pages/InstructorDashboard";
import InstructorRequest from "./pages/InstructorRequest";
import InstructorEditCourse from "./pages/InstructorEditCourse"; // new instructor edit component
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CoursesPage from "./pages/Courses";
import AboutPage from "./pages/About";
import FeaturesPage from "./pages/Features";
import CreateCourse from "./pages/CreateCourse";
import Enroll from "./pages/Enroll";
import CoursePage from "./pages/CoursePage";
import StudentDashboard from "./pages/StudentDashboard";
import LessonPage from "./pages/LessonPage";
import ModuleAssessmentPage from "./pages/ModuleAssessmentPage";
import FinalCourseAssessmentPage from "./pages/FinalCourseAssessmentPage";
import Certificate from "./pages/Certificate";
import ManageCategories from "./pages/ManageCategories";
import ManageTheme from "./pages/ManageTheme";

const AppRoutes: React.FC = () => {
  const { user, adminUser } = useSelector((state: RootState) => state.auth);

  return (
    <Router>
      <Routes>
        {/* General Public Routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/courses/:courseId" element={<CoursePage />} />
        {/* Legacy singular course path support */}
        <Route path="/course/:courseId" element={<CoursePage />} />

        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Enrollment Routes */}
        <Route
          path="/enroll/:courseId"
          element={user ? <Enroll /> : <Navigate to="/login" />}
        />
        <Route
          path="/courses/:courseId/enroll"
          element={user ? <Enroll /> : <Navigate to="/login" />}
        />
        <Route
          path="/course/:courseId/enroll"
          element={user ? <Enroll /> : <Navigate to="/login" />}
        />

        {/* Learning & Lesson Routes */}
        <Route
          path="/courses/:courseId/learn"
          element={user ? <CoursePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/course/:courseId/learn"
          element={user ? <CoursePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/courses/:courseId/modules/:moduleId/lessons/:lessonIndex"
          element={user ? <LessonPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/course/:courseId/modules/:moduleId/lessons/:lessonIndex"
          element={user ? <LessonPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/courses/:courseId/modules/:moduleId/assessment"
          element={user ? <ModuleAssessmentPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/course/:courseId/modules/:moduleId/assessment"
          element={user ? <ModuleAssessmentPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/courses/:courseId/final-assessment"
          element={user ? <FinalCourseAssessmentPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/course/:courseId/final-assessment"
          element={user ? <FinalCourseAssessmentPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/courses/:courseId/certificate"
          element={user ? <Certificate /> : <Navigate to="/login" />}
        />
        <Route
          path="/course/:courseId/certificate"
          element={user ? <Certificate /> : <Navigate to="/login" />}
        />

        {/* Dashboard Route */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/" />}
        />

        {/* Admin Routes */}
        {/* Redirect /admin to login or dashboard */}
        <Route
          path="/admin"
          element={<Navigate to={adminUser?.role === "admin" ? "/admin/dashboard" : "/admin/login"} />}
        />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/admin/manage-categories" element={adminUser?.role === "admin" ? <ManageCategories /> : <AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={adminUser?.role === "admin" ? <AdminDashboard /> : <AdminLogin />}
        />
        <Route path="/admin/manage-theme" element={<ManageTheme />} />
        {/* Admin Edit Course Route */}
        <Route path="/admin/edit-course/:courseId" element={<AdminEditCourse />} />

        {/* Instructor Routes */}
        <Route
          path="/instructor/dashboard"
          element={
            user?.role === "instructor" ? (
              <InstructorDashboard />
            ) : user?.role === "pending" ? (
              <InstructorRequest />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        {/* Instructor Create Course Route */}
        <Route
          path="/instructor/create-course"
          element={
            user?.role === "instructor" ? (
              <CreateCourse />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        {/* Legacy alias redirect */}
        <Route path="/create-course" element={<Navigate to="/instructor/create-course" />} />
        {/* Instructor Edit Course Route */}
        <Route path="/instructor/edit-course/:courseId" element={<InstructorEditCourse />} />

        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={user?.role === "student" ? <StudentDashboard /> : <Navigate to="/dashboard" />}
        />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
