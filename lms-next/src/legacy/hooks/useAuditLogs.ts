import { useCallback, useEffect, useState } from 'react';
import adminApi from '../utils/adminApi';

export type AuditEntry = {
  _id: string;
  actorId?: string;
  actorRole?: string;
  actionType: string;
  resourceType: string;
  resourceId?: string;
  details?: any;
  tenantId?: string | null;
  ipAddress?: string | null;
  createdAt?: string;
};

export default function useAuditLogs(params?: { limit?: number; page?: number }) {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set('limit', String(params?.limit || 10));
      qs.set('page', String(params?.page || 1));
      const res = await adminApi.get(`/admin/audit-logs?${qs.toString()}`);
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      console.error('Failed to load audit logs', err?.message || err);
      setError(err?.response?.data?.error || err?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [params?.limit, params?.page]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { items, total, loading, error, refresh: fetch };
}
