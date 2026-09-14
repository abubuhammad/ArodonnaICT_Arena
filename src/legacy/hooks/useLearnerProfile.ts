import { useCallback, useEffect, useState } from 'react';
import adminApi from '../utils/adminApi';

export type EnrollmentRecord = {
  _id: string;
  courseId: string;
  courseName?: string;
  status?: string; // 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'DROPPED'
  progress?: number;
  enrolledAt?: string;
  completedAt?: string;
  certificate?: { id?: string; issuedAt?: string; downloadUrl?: string } | null;
  certificateIssued?: boolean;
  grade?: string;
};

export type LearnerProfile = {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  lastLogin?: string;
  enrollments?: EnrollmentRecord[];
  totalEnrollments?: number;
  completedCourses?: number;
  averageProgress?: number;
};

export default function useLearnerProfile(userId?: string) {
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get(`/admin/users/${userId}/profile`);
      const normalized = {
        ...res.data,
        enrollments: Array.isArray(res.data?.enrollments)
          ? res.data.enrollments.map((e: any) => ({
              ...e,
              certificateIssued: !!e?.certificate?.id,
            }))
          : [],
      } as any;
      setProfile(normalized);
    } catch (err: any) {
      console.error('Failed to load learner profile', err?.message || err);
      setError(err?.response?.data?.error || err?.message || 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { profile, loading, error, refresh: fetch };
}
