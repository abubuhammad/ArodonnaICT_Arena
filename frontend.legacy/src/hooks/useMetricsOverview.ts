import { useCallback, useEffect, useState } from "react";
import adminApi from "../utils/adminApi";

type MetricItem = { value: number | string; change?: string };

type MetricsOverview = {
  activeLearners: MetricItem;
  newEnrollments: MetricItem;
  completions: MetricItem;
  revenue: MetricItem;
};

const fallback: MetricsOverview = {
  activeLearners: { value: 1245, change: "+4%" },
  newEnrollments: { value: 312, change: "+8%" },
  completions: { value: "72%", change: "-2%" },
  revenue: { value: "$8,420", change: "+12%" },
};

export default function useMetricsOverview(params?: { days?: number; tenantId?: string }) {
  const [data, setData] = useState<MetricsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (params?.days) qs.set('days', String(params.days));
      if (params?.tenantId) qs.set('tenantId', params.tenantId);
      const res = await adminApi.get(`/admin/metrics/overview?${qs.toString()}`);
      if (res?.data) {
        setData(res.data);
      } else {
        setData(fallback);
      }
    } catch (err: any) {
      // If backend not available, fallback to mock data
      setData(fallback);
      setError(err?.response?.data?.error || err?.message || "Failed to fetch metrics");
    } finally {
      setLoading(false);
    }
  }, [params?.days, params?.tenantId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}
