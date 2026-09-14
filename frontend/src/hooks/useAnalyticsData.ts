import { useCallback, useEffect, useState } from 'react';
import adminApi from '../utils/adminApi';

export type EnrollmentTrendPoint = {
  date: string;
  count: number;
  cumulative?: number;
};

export type CompletionRateCourse = {
  courseId: string;
  courseName: string;
  totalEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
};

export type AnalyticsData = {
  enrollmentTrend: EnrollmentTrendPoint[];
  completionRates: CompletionRateCourse[];
  totalEnrollments: number;
  totalCompleted: number;
  overallCompletionRate: number;
};

export default function useAnalyticsData(params?: { days?: number; tenantId?: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (params?.days) qs.set('days', String(params.days));
      if (params?.tenantId) qs.set('tenantId', params.tenantId);

      const res = await adminApi.get(`/admin/analytics?${qs.toString()}`);
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load analytics', err?.message || err);
      setError(err?.response?.data?.error || err?.message || 'Failed to load analytics');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [params?.days, params?.tenantId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}
