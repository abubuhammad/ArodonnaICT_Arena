import { useEffect, useState, useCallback } from 'react';
import adminApi from '../utils/adminApi';

export interface CohortRow {
  cohortStart: string;
  totalEnrolled: number;
  completedWithin1Week: number;
  completedWithin2Weeks: number;
  completedWithin4Weeks: number;
  completedWithin8Weeks: number;
  pctWithin1Week: number;
  pctWithin2Weeks: number;
  pctWithin4Weeks: number;
  pctWithin8Weeks: number;
}

export default function useCohortsData(params?: { weeks?: number; tenantId?: string }) {
  const [data, setData] = useState<{ cohorts: CohortRow[] } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const weeks = params?.weeks;
  const tenantId = params?.tenantId;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get(`/admin/analytics/cohorts`, { params: { weeks, tenantId } });
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to fetch cohorts');
    } finally {
      setLoading(false);
    }
  }, [weeks, tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
