import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, BookOpenCheck, School2, Loader2 } from "lucide-react";
import EnrollmentList from "../components/admin/EnrollmentList";
import GrantFreeEnrollmentModal from "../components/admin/GrantFreeEnrollmentModal";
import LearnerProfileModal from "../components/admin/LearnerProfileModal";
import AdminAnalytics from "../components/admin/AdminAnalytics";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import adminApi from "../utils/adminApi";
import UsersTable from "../components/admin/UsersTable";
import CoursesList from "../components/admin/CoursesList";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import AdminHomeKPIs from "../components/admin/AdminHomeKPIs";
import AdminAuditLogs from "../components/admin/AdminAuditLogs";
import FreeEnrollmentForm from "../components/admin/FreeEnrollmentForm";
import DashboardLayout from "../components/layout/DashboardLayout";
import StatsCard from "../components/ui/StatsCard";
import CertificatesList from "../components/admin/CertificatesList";
import PlatformSettings from "../components/admin/PlatformSettings";
import CertificateTemplateAssignment from "../components/admin/CertificateTemplateAssignment";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "student" | "instructor" | "admin" | "pending";
}

interface Course {
  _id: string;
  title: string;
  instructor: { _id: string; name: string } | string;
  price?: number;
  isFree?: boolean;
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [enrollmentRefreshKey, setEnrollmentRefreshKey] = useState(0);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deleteDebug, setDeleteDebug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLearnerUserId, setSelectedLearnerUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { adminUser, adminToken } = useSelector((state: RootState) => state.auth);

  // Check for admin authentication
  useEffect(() => {
    const checkAuth = async () => {
      if (!adminUser || !adminToken) {
        console.log("No admin user or token found, redirecting to login");
        navigate("/admin/login");
        return;
      }
    };

    checkAuth();
  }, [adminUser, adminToken, navigate]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [location.hash]);

  // Separate data fetching from auth check
  useEffect(() => {
    if (adminToken) {
      const loadInitialData = async () => {
        setLoading(true);
        try {
          await Promise.all([fetchUsers(), fetchCourses()]);
        } catch (error) {
          console.error("Error loading initial data:", error);
        } finally {
          setLoading(false);
        }
      };
      
      loadInitialData();
    }
  }, [adminToken]); // Only run when adminToken changes

  // Remove the fetchUsers useCallback and replace with regular function
  const fetchUsers = async () => {
    if (!adminToken) {
      console.log("No admin token available for fetching users");
      return;
    }

    setError(null);

    try {
      const response = await adminApi.get("/admin/users");

      const data = response.data;

      const userArray = Array.isArray(data) ? data : data.users || [];

      const normalized = userArray.map((u: any) => ({
        _id: u._id || u.id,
        name: u.name || 'No Name',
        email: u.email || 'No Email',
        role: (u.role || 'student').toString().toLowerCase(),
      }));

      setUsers(normalized);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setError(error.response?.data?.message || "Failed to fetch users");
      setUsers([]);

      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/admin/login");
      }
    }
  };

  // Remove the fetchCourses useCallback and replace with regular function
  const fetchCourses = async () => {
    if (!adminToken) return;

    setCoursesLoading(true);
    try {
      const response = await adminApi.get(`/courses`);
      const data = response.data;
      setCourses(data);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/admin/login");
      }
    } finally {
      setCoursesLoading(false);
    }
  };

  // Update the refresh buttons to use manual refresh functions
  const handleRefreshUsers = () => {
    fetchUsers();
  };

  const handleRefreshCourses = () => {
    fetchCourses();
  };

  const handleCreateFreeEnrollment = async (userId: string, courseId: string) => {
    try {
      await adminApi.post(`/admin/enrollments/grant-free`, { userId, courseId });
      setEnrollmentRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      const message = error?.response?.data?.error || "Failed to grant free enrollment";
      throw new Error(message);
    }
  };

  const handleGrantFreeEnrollment = async () => {
    try {
      await adminApi.patch(`/admin/enrollments/${selectedEnrollment._id}/grant-free`);
      setShowGrantModal(false);
      setSelectedEnrollment(null);
      setEnrollmentRefreshKey((prev) => prev + 1);
      fetchUsers();
    } catch (error) {
      console.error("Error granting free enrollment:", error);
    }
  };

  // Add type guard for user objects
  const isValidUser = (user: any): user is User => {
    if (!user || typeof user !== 'object') return false;
    const id = user._id || user.id;
    const role = typeof user.role === 'string' ? user.role.toLowerCase() : 'student';
    const hasId = typeof id === 'string' && id.length > 0;
    const hasName = typeof user.name === 'string' || user.name === null || typeof user.name === 'undefined';
    const hasEmail = typeof user.email === 'string' || user.email === null || typeof user.email === 'undefined';

    if (!hasId || !hasName || !hasEmail) {
      console.log("Invalid user object:", user);
      return false;
    }

    user._id = id;
    user.role = role;
    return true;
  };

  const filteredUsers = users.filter((user) => {
    if (!isValidUser(user)) return false;
    
    if (searchTerm === "") return true;
    
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = (user.name || '').toLowerCase().includes(searchLower);
    const emailMatch = (user.email || '').toLowerCase().includes(searchLower);
    
    return nameMatch || emailMatch;
  });

  const pendingInstructors = users.filter((user) => {
    if (!isValidUser(user)) return false;
    return user.role === "pending";
  });

  // Update setUserToDelete calls to use type guard
  const handleDeleteUser = (user: any) => {
    if (isValidUser(user)) {
      setDeleteError(null);
      setDeleteSuccess(null);
      setUserToDelete(user);
    } else {
      console.error('Invalid user object:', user);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      if (deletingUserId) return;
      setDeleteError(null);
      setDeleteSuccess(null);
      setDeleteDebug(null);
      setDeletingUserId(id);
      const targetId = id || (userToDelete as any)?._id || (userToDelete as any)?.id;
      if (!targetId) {
        setDeleteError('Missing user id for deletion');
        return;
      }

      if (!adminToken) {
        setDeleteError('Admin token missing. Please log in again.');
        return;
      }

      setDeleteDebug(`Attempting delete for user ${targetId}; token present=${!!adminToken}; token snippet=${adminToken?.slice?.(-8) || 'n/a'}`);

      const response = await adminApi.delete(`/admin/users/${targetId}`);
      if (response?.status && response.status >= 400) {
        setDeleteError(`Delete failed (status ${response.status}).`);
      }

      setUsers((prevUsers) => {
        const next = prevUsers.filter((user) => user._id !== targetId && (user as any).id !== targetId);
        if (next.length === prevUsers.length) {
          setDeleteError('Delete request completed but user list was unchanged. Please refresh.');
        } else {
          setDeleteSuccess('User deleted successfully');
        }
        return next;
      });

      setUserToDelete(null);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      const status = error?.response?.status;
      const message = error?.response?.data?.error || (status ? `Failed to delete user (status ${status})` : 'Failed to delete user');
      setDeleteError(message);
      setDeleteDebug(`Delete error for user ${id}: ${message}`);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleApproveInstructor = async (userId: string) => {
    try {
      await adminApi.patch(`/admin/users/${userId}/approve-instructor`);
      fetchUsers();
    } catch (error) {
      console.error("Error approving instructor:", error);
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      await adminApi.delete(`/courses/${courseId}`);
      setCourses(prev => prev.filter(course => course._id !== courseId));
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  const editCourse = (courseId: string) => {
    navigate(`/admin/edit-course/${courseId}`);
  };

  // Navigate to Manage Categories page
  const manageCategories = () => {
    navigate("/admin/manage-categories");
  };

  const totalUsers = users.length;
  const totalCourses = courses.length;
  const pendingInstructorsCount = pendingInstructors.length;

  const activeNav = location.hash === '#courses' ? 'courses' : location.hash === '#users' ? 'users' : 'dashboard';

  if (loading || !adminUser || !adminToken) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      adminUser={adminUser}
      onSearchChange={setSearchTerm}
      searchTerm={searchTerm}
      activeItem={activeNav}
    >
      <div className="space-y-8 py-6">
      <AdminHomeKPIs />
        <div className="space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold leading-tight text-slate-950 dark:text-slate-50"
          >
            Admin Dashboard
          </motion.h1>
          <p className="text-base font-normal leading-6 text-slate-500 dark:text-slate-400">
            Manage users, courses, enrollments, system settings, categories, and theme
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" role="list">
          <StatsCard
            label="Total Users"
            value={totalUsers}
            icon={<Users size={18} />}
            accent="from-indigo-500 to-purple-500"
          />
          <StatsCard
            label="Pending Instructors"
            value={pendingInstructorsCount}
            icon={<School2 size={18} />}
            accent="from-amber-500 to-orange-500"
          />
          <StatsCard
            label="Courses"
            value={totalCourses}
            icon={<BookOpenCheck size={18} />}
            accent="from-emerald-500 to-teal-500"
          />
          <StatsCard
            label="Pending Enrollments"
            value={"—"}
            icon={<Loader2 size={18} />}
            accent="from-slate-500 to-slate-700"
          />
        </div>

        <UsersTable
          users={filteredUsers}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={handleRefreshUsers}
          onDelete={handleDeleteUser}
          onApprove={handleApproveInstructor}
          onViewProfile={setSelectedLearnerUserId}
        />

        <AdminAnalytics days={30} tenantId={undefined} />

        <AdminAuditLogs />

        {(deleteError || deleteSuccess) && (
          <div className="px-4">
            {deleteError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm leading-5 text-red-800 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-200" role="alert">
                {deleteError}
              </div>
            )}
            {deleteSuccess && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm leading-5 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200" role="status">
                {deleteSuccess}
              </div>
            )}
            {deleteDebug && (
              <div className="mt-2 text-xs text-slate-500">{deleteDebug}</div>
            )}
          </div>
        )}

        <div id="instructor-approval" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold leading-7 text-slate-950 dark:text-slate-50">Instructor approval</h2>
              <p className="mt-1 text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">Approve pending instructor requests.</p>
            </div>
            <button
              onClick={handleRefreshUsers}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>
          {pendingInstructors.length === 0 ? (
            <div className="py-12 text-center text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">No pending instructors.</div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {pendingInstructors.map((user) => (
                <div key={user._id} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-sm font-semibold leading-5 text-slate-950 dark:text-slate-50">{user.name || "No Name"}</p>
                    <p className="mt-1 text-xs font-medium leading-4 text-slate-500 dark:text-slate-400">{user.email || "No Email"}</p>
                  </div>
                  {user._id && (
                    <button
                      onClick={() => handleApproveInstructor(user._id)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                    >
                      Approve
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900" id="users">
          <h2 className="text-lg font-semibold leading-7 text-slate-950 dark:text-slate-50">Enrollment management</h2>
          <p className="mt-1 mb-6 text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">Manage access, certificates, and enrollment status.</p>
          {adminToken ? (
            <>
              <FreeEnrollmentForm
                users={users}
                courses={courses as any}
                onSubmit={handleCreateFreeEnrollment}
              />
              <EnrollmentList
                adminToken={adminToken || ""}
                onGrantFree={(enrollment) => {
                  setSelectedEnrollment(enrollment);
                  setShowGrantModal(true);
                }}
                refreshSignal={enrollmentRefreshKey}
              />
              <div className="mt-6">
                <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-3">Certificates</h3>
                <CertificatesList />
              </div>
              <div className="mt-6">
                <CertificateTemplateAssignment users={users} />
              </div>
            </>
          ) : (
            <SkeletonLoader lines={3} />
          )}
        </div>

        <CoursesList
          onRefresh={handleRefreshCourses}
          onEdit={editCourse}
          onDelete={deleteCourse}
          onManageCategories={manageCategories}
          onManageTheme={() => navigate("/admin/manage-theme")}
        />

        <div className="mt-6">
          <PlatformSettings />
        </div>

        <GrantFreeEnrollmentModal
          isOpen={showGrantModal}
          onClose={() => setShowGrantModal(false)}
          onGrant={handleGrantFreeEnrollment}
          enrollmentUserName={selectedEnrollment?.user?.name || selectedEnrollment?.user?.email || ""}
        />

        <AlertDialog
          open={!!userToDelete}
          onOpenChange={(open) => {
            if (!open) {
              setUserToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user
                {userToDelete?.name ? ` "${userToDelete.name}"` : ''} and remove their data from the server.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingUserId) return;
                  if (userToDelete?._id) deleteUser(userToDelete._id);
                  else if ((userToDelete as any)?.id) deleteUser((userToDelete as any).id);
                }}
              >
                {deletingUserId ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <LearnerProfileModal
          userId={selectedLearnerUserId}
          onClose={() => setSelectedLearnerUserId(null)}
          onAction={(action, userId) => {
            if (action === 'message') {
              // Placeholder for message action
              console.log('Message user:', userId);
              alert('Messaging feature coming soon!');
            } else if (action === 'enroll') {
              // Placeholder for enroll action
              console.log('Enroll user:', userId);
              alert('Enrollment feature coming soon!');
            }
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
