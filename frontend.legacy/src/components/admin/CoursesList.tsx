import React, { useState } from "react";
import { RefreshCw, Edit3, Trash2, BookOpen, Eye, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SkeletonLoader from "../ui/SkeletonLoader";
import useCourseManagement, { CourseStatus, CourseMetadata } from "../../hooks/useCourseManagement";
import adminApi from "../../utils/adminApi";

interface CoursesListProps {
  onRefresh: () => void;
  onEdit: (courseId: string) => void;
  onDelete: (courseId: string) => void;
  onManageCategories: () => void;
  onManageTheme: () => void;
}

const CoursesList: React.FC<CoursesListProps> = ({
  onRefresh,
  onEdit,
  onDelete,
  onManageCategories,
  onManageTheme,
}) => {
  const [statusFilter, setStatusFilter] = useState<CourseStatus | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { courses, loading, error, refresh } = useCourseManagement({
    status: statusFilter as CourseStatus | undefined,
    search: searchTerm,
  });

  const updateStatus = async (course: CourseMetadata, nextStatus: CourseStatus) => {
    try {
      await adminApi.patch(`/courses/${course._id}/status`, { status: nextStatus.toUpperCase() });
      refresh();
      onRefresh();
    } catch (error: any) {
      console.error("Failed to update course status", error);
      window.alert(error?.response?.data?.error || "Failed to update course status");
    }
  };

  const handleStatusAction = async (course: CourseMetadata) => {
    const status = (course.status || "draft") as CourseStatus;
    if (status === "draft") return updateStatus(course, "published");
    if (status === "review" || status === "qa") return updateStatus(course, "published");
    if (status === "published") return updateStatus(course, "archived");
    if (status === "archived") return updateStatus(course, "draft");
  };

  const handlePreview = (courseId: string) => {
    // Open course in a new tab
    window.open(`/courses/${courseId}`, "_blank");
  };
  return (
    <div id="courses" className="rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Course Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage courses, publish/unpublish, and organize content.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              refresh();
              onRefresh();
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={onManageCategories}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <BookOpen size={16} /> Categories
          </button>
          <button
            onClick={onManageTheme}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <BookOpen size={16} /> Theme
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search courses by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CourseStatus | "")}
          className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="qa">QA</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <SkeletonLoader lines={4} />
        ) : error ? (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">{error}</div>
        ) : courses.length === 0 ? (
          <div className="text-sm text-slate-500 p-4 text-center">No courses found.</div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Instructor</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                  {courses.map((course) => (
                    <tr key={course._id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{course.title}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {typeof course.instructor === "object" && course.instructor
                          ? course.instructor.name
                          : typeof course.instructor === "string"
                          ? course.instructor
                          : "No instructor"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            course.status === "published"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : course.status === "review" || course.status === "qa"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : course.status === "draft"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {course.status || "published"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handlePreview(course._id)}
                            title="Preview course"
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => handleStatusAction(course)}
                            title={
                              course.status === "draft"
                                ? "Publish"
                                : course.status === "review" || course.status === "qa"
                                ? "Publish"
                                : course.status === "published"
                                ? "Archive"
                                : "Restore to draft"
                            }
                            className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-md border text-xs ${
                              course.status === "published"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                : course.status === "review" || course.status === "qa"
                                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                : course.status === "draft"
                                ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            <Zap size={13} />
                            <span className="sr-only">
                              {course.status === "draft"
                                ? "Publish"
                                : course.status === "review" || course.status === "qa"
                                ? "Publish"
                                : course.status === "published"
                                ? "Archive"
                                : "Restore to draft"}
                            </span>
                          </button>
                          <button
                            onClick={() => onEdit(course._id)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => onDelete(course._id)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 text-xs"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              <AnimatePresence>
                {courses.map((course) => (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{course.title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {typeof course.instructor === "object" && course.instructor
                            ? course.instructor.name
                            : typeof course.instructor === "string"
                            ? course.instructor
                            : "No instructor"}
                        </p>
                        <div className="mt-2">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                              course.status === "published"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : course.status === "review" || course.status === "qa"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                : course.status === "draft"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {course.status || "published"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 text-right">
                        <button
                          onClick={() => handlePreview(course._id)}
                          title="Preview"
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 text-xs"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => handleStatusAction(course)}
                          title={
                            course.status === "draft"
                              ? "Publish"
                              : course.status === "review" || course.status === "qa"
                              ? "Publish"
                              : course.status === "published"
                              ? "Archive"
                              : "Restore to draft"
                          }
                          className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-md border text-xs ${
                            course.status === "published"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : course.status === "review" || course.status === "qa"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : course.status === "draft"
                              ? "bg-amber-50 text-amber-600 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          <Zap size={12} />
                          <span className="sr-only">
                            {course.status === "draft"
                              ? "Publish"
                              : course.status === "review" || course.status === "qa"
                              ? "Publish"
                              : course.status === "published"
                              ? "Archive"
                              : "Restore to draft"}
                          </span>
                        </button>
                        <button
                          onClick={() => onEdit(course._id)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 text-xs"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => onDelete(course._id)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-red-50 text-red-600 border border-red-100 text-xs"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(CoursesList);
