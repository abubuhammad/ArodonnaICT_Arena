import { useEffect, useState, useCallback } from 'react';
import adminApi from '../utils/adminApi';

export interface FunnelsData {
  enrolled: number;
  started: number;
  paid: number;
  completed: number;
}

export default function useFunnelsData(params?: { days?: number; tenantId?: string }) {
  const [data, setData] = useState<FunnelsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const days = params?.days;
  const tenantId = params?.tenantId;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get(`/admin/analytics/funnels`, { params: { days, tenantId } });
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to fetch funnels');
    } finally {
      setLoading(false);
    }
  }, [days, tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
