import { useCallback, useEffect, useState } from "react";
import adminApi from "../utils/adminApi";

export default function useTenants() {
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get("/admin/tenants");
      setTenants(res.data || []);
    } catch (err: any) {
      console.warn("Failed to load tenants, falling back to default", err?.message || err);
      setTenants([{ id: "__all", name: "All tenants" }]);
      setError(err?.message || "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { tenants, loading, error, refresh: fetch };
}
