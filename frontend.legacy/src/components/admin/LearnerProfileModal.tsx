import React, { useState } from 'react';
import { X, Mail, Calendar, BookOpen, Award } from 'lucide-react';
import useLearnerProfile from '../../hooks/useLearnerProfile';
import SkeletonLoader from '../ui/SkeletonLoader';
import adminApi from '../../utils/adminApi';

interface LearnerProfileModalProps {
  userId: string | null;
  onClose: () => void;
  onAction?: (action: 'enroll' | 'unenroll' | 'message', userId: string) => void;
}

const LearnerProfileModal: React.FC<LearnerProfileModalProps> = ({
  userId,
  onClose,
  onAction,
}) => {
  const { profile, loading, error } = useLearnerProfile(userId || undefined);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [issueSuccess, setIssueSuccess] = useState<string | null>(null);

  const issueCertificate = async (enrollmentId: string) => {
    if (!enrollmentId) return;
    setIssuingId(enrollmentId);
    setIssueError(null);
    setIssueSuccess(null);
    try {
      await adminApi.post('/admin/certificates/issue', { enrollmentId });
      setIssueSuccess('Certificate issued');
    } catch (err: any) {
      setIssueError(err?.response?.data?.error || err?.message || 'Failed to issue certificate');
    } finally {
      setIssuingId(null);
    }
  };

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Learner Profile</h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30 text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-200px)] p-6">
          {loading ? (
            <SkeletonLoader lines={5} />
          ) : error ? (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-600 dark:text-red-300">
              {error}
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {profile.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 capitalize mt-1">
                    {profile.role}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {profile.email}
                      </p>
                    </div>
                  </div>

                  {profile.createdAt && (
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Joined</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {profile.lastLogin && (
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Last Login</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {new Date(profile.lastLogin).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/20 p-3">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">Enrollments</p>
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {profile.totalEnrollments || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Completed</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {profile.completedCourses || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
                  <p className="text-xs text-amber-600 dark:text-amber-400">Avg Progress</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {Math.round(profile.averageProgress || 0)}%
                  </p>
                </div>
                <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 p-3">
                  <p className="text-xs text-purple-600 dark:text-purple-400">Certificates</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {profile.enrollments?.filter((e) => e.certificateIssued).length || 0}
                  </p>
                </div>
              </div>

              {/* Enrollments */}
              {profile.enrollments && profile.enrollments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <BookOpen size={20} />
                    Enrollment History
                  </h3>
                  <div className="space-y-2">
                    {profile.enrollments.map((enrollment) => (
                      <div
                        key={enrollment._id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {enrollment.courseName || 'Course'}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Enrolled: {enrollment.enrolledAt
                                ? new Date(enrollment.enrolledAt).toLocaleDateString()
                                : '—'}
                            </p>
                            {enrollment.completedAt && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                                Completed: {new Date(enrollment.completedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1">
                              <div className="text-right">
                                <p className="text-xs text-slate-500">Progress</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {enrollment.progress || 0}%
                                </p>
                              </div>
                              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  {enrollment.progress || 0}%
                                </span>
                              </div>
                            </div>
                            {enrollment.certificateIssued && (
                              <div title="Certificate issued" className="flex items-center gap-1 text-amber-600 dark:text-amber-300 text-xs">
                                <Award size={16} className="text-amber-500" />
                                {enrollment.certificate?.downloadUrl && (
                                  <a
                                    className="underline hover:text-amber-700"
                                    href={enrollment.certificate.downloadUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    View
                                  </a>
                                )}
                              </div>
                            )}
                            {!enrollment.certificateIssued && enrollment.status === 'COMPLETED' && (
                              <button
                                onClick={() => issueCertificate(enrollment._id)}
                                disabled={issuingId === enrollment._id}
                                className="px-2 py-1 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                              >
                                {issuingId === enrollment._id ? 'Issuing...' : 'Issue certificate'}
                              </button>
                            )}
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                enrollment.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : enrollment.status === 'ACTIVE'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {enrollment.status || 'ACTIVE'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!profile.enrollments || profile.enrollments.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No enrollments yet.</p>
                </div>
              )}

              {(issueError || issueSuccess) && (
                <div className="space-y-2">
                  {issueError && (
                    <div className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                      {issueError}
                    </div>
                  )}
                  {issueSuccess && (
                    <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200">
                      {issueSuccess}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer / Actions */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-6 py-4 flex gap-2 justify-end">
          {onAction && profile && (
            <>
              <button
                onClick={() => onAction('message', profile._id)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium"
              >
                Message
              </button>
              <button
                onClick={() => onAction('enroll', profile._id)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium"
              >
                Enroll in Course
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearnerProfileModal;
