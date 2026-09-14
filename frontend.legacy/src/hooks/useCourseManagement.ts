import { useCallback, useEffect, useState } from 'react';
import adminApi from '../utils/adminApi';

export type CourseStatus = 'draft' | 'review' | 'qa' | 'published' | 'archived';

export type CourseMetadata = {
  _id: string;
  title: string;
  instructor: { _id: string; name: string } | string;
  status?: CourseStatus;
  category?: string;
  language?: string;
  price?: number;
  isFree?: boolean;
  createdAt?: string;
  enrollmentCount?: number;
};

export interface CourseManagementParams {
  status?: CourseStatus;
  category?: string;
  instructor?: string;
  search?: string;
}

export default function useCourseManagement(params?: CourseManagementParams) {
  const [courses, setCourses] = useState<CourseMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query string with filters
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.category) qs.set('category', params.category);
      if (params?.instructor) qs.set('instructor', params.instructor);
      if (params?.search) qs.set('search', params.search);

      const res = await adminApi.get(`/courses?${qs.toString()}`);
      const courseData = Array.isArray(res.data) ? res.data : res.data?.courses || [];
      
      // Ensure each course has a status field (default to 'published' for backward compat)
      const enriched = courseData.map((c: any) => ({
        ...c,
        status: (c.status || 'published').toString().toLowerCase(),
      }));
      
      setCourses(enriched);
    } catch (err: any) {
      console.error('Failed to load courses', err?.message || err);
      setError(err?.response?.data?.error || err?.message || 'Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [params?.status, params?.category, params?.instructor, params?.search]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { courses, loading, error, refresh: fetch };
}
