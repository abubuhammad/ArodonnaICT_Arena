import React, { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import useAnalyticsData from '../../hooks/useAnalyticsData';
import AdminFunnels from './AdminFunnels';
import AdminCohorts from './AdminCohorts';
import SkeletonLoader from '../ui/SkeletonLoader';

interface AdminAnalyticsProps {
  days?: number;
  tenantId?: string;
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ days = 30, tenantId }) => {
  const { data, loading, error, refresh } = useAnalyticsData({ days, tenantId });

  const handleExportCSV = () => {
    if (!data) return;

    // Create CSV content
    let csv = 'Analytics Export\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Enrollment Trend
    csv += 'ENROLLMENT TREND\n';
    csv += 'Date,Daily Enrollments,Cumulative Enrollments\n';
    data.enrollmentTrend.forEach((point) => {
      csv += `${point.date},${point.count},${point.cumulative || 0}\n`;
    });

    csv += '\n';

    // Completion Rates
    csv += 'COMPLETION RATES BY COURSE\n';
    csv += 'Course Name,Total Enrollments,Completed,Completion Rate (%)\n';
    data.completionRates.forEach((course) => {
      csv += `"${course.courseName}",${course.totalEnrollments},${course.completedEnrollments},${course.completionRate.toFixed(2)}\n`;
    });

    csv += '\n';

    // Summary
    csv += 'SUMMARY\n';
    csv += `Total Enrollments,${data.totalEnrollments}\n`;
    csv += `Total Completed,${data.totalCompleted}\n`;
    csv += `Overall Completion Rate (%),${data.overallCompletionRate.toFixed(2)}\n`;

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-950/20 dark:to-indigo-950/20 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Analytics & Reports</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Enrollment trends and course completion rates</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          {data && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <SkeletonLoader lines={6} />
        ) : error ? (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        ) : data ? (
          <div className="space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/20 p-4">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Total Enrollments</p>
                <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 mt-2">
                  {data.totalEnrollments}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-4">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Completed</p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mt-2">
                  {data.totalCompleted}
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-4">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Completion Rate</p>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300 mt-2">
                  {data.overallCompletionRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Enrollment Trend Chart (Simplified) */}
            <div>
              <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-4">Enrollment Trend</h3>
              <div className="space-y-2">
                {data.enrollmentTrend.length === 0 ? (
                  <p className="text-sm text-slate-500">No enrollment data available.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="flex gap-1 h-40 items-end">
                      {data.enrollmentTrend.map((point, idx) => {
                        const maxCount = Math.max(...data.enrollmentTrend.map((p) => p.count), 1);
                        const height = (point.count / maxCount) * 100;
                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center"
                            title={`${point.date}: ${point.count} enrollments`}
                          >
                            <div
                              className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t hover:opacity-80 transition-opacity cursor-pointer"
                              style={{ height: `${height}%`, minHeight: '4px' }}
                            />
                            <p className="text-xs text-slate-500 mt-2 hidden sm:block">
                              {point.date.slice(5)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Completion Rates Table */}
            <div>
              <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Completion Rates by Course
              </h3>
              {data.completionRates.length === 0 ? (
                <p className="text-sm text-slate-500">No course data available.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="px-4 py-3 text-left">Course</th>
                        <th className="px-4 py-3 text-center">Total</th>
                        <th className="px-4 py-3 text-center">Completed</th>
                        <th className="px-4 py-3 text-right">Completion Rate</th>
                        <th className="px-4 py-3 text-right">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                      {data.completionRates.map((course) => (
                        <tr key={course.courseId} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                            {course.courseName}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">
                            {course.totalEnrollments}
                          </td>
                          <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400 font-medium">
                            {course.completedEnrollments}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                course.completionRate >= 70
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : course.completionRate >= 40
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              }`}
                            >
                              {course.completionRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                                style={{ width: `${course.completionRate}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Advanced Analytics: Funnels & Cohorts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AdminFunnels days={days} tenantId={tenantId} />
                    <AdminCohorts weeks={8} tenantId={tenantId} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminAnalytics;
