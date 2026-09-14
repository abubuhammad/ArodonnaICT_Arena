import React, { useState } from "react";
import StatsCard from "../ui/StatsCard";
import SkeletonLoader from "../ui/SkeletonLoader";
import useMetricsOverview from "../../hooks/useMetricsOverview";
import useTenants from "../../hooks/useTenants";

const AdminHomeKPIs: React.FC = () => {
  const [days, setDays] = useState<number>(7);
  const [tenantId, setTenantId] = useState<string | undefined>(undefined);

  const { tenants, loading: tenantsLoading } = useTenants();

  const { data, loading, error, refresh } = useMetricsOverview({ days, tenantId });

  const values = data || {
    activeLearners: { value: 1245, change: "+4%" },
    newEnrollments: { value: 312, change: "+8%" },
    completions: { value: "72%", change: "-2%" },
    revenue: { value: "$8,420", change: "+12%" },
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Overview</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Quick platform health & KPIs</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-slate-900/60 rounded-md border border-slate-200 dark:border-slate-800 p-1">
            <button
              onClick={() => setDays(7)}
              className={`px-3 py-1 text-sm rounded ${days === 7 ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
            >
              7d
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-3 py-1 text-sm rounded ${days === 30 ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
            >
              30d
            </button>
            <button
              onClick={() => setDays(90)}
              className={`px-3 py-1 text-sm rounded ${days === 90 ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
            >
              90d
            </button>
          </div>

          <select
            value={tenantId || "__all"}
            onChange={(e) => setTenantId(e.target.value === "__all" ? undefined : e.target.value)}
            className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 text-sm"
          >
            {tenantsLoading ? (
              <option>Loading tenants...</option>
            ) : (
              (tenants || [{ id: '__all', name: 'All tenants' }]).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))
            )}
          </select>

          <button
            onClick={() => refresh()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader lines={2} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label={`Active Learners (7d)`}
            value={values.activeLearners.value}
            accent="from-indigo-500 to-purple-500"
          />
          <StatsCard
            label={`New Enrollments`}
            value={values.newEnrollments.value}
            accent="from-emerald-500 to-teal-500"
          />
          <StatsCard
            label={`Course Completions`}
            value={values.completions.value}
            accent="from-amber-500 to-orange-500"
          />
          <StatsCard
            label={`Revenue`}
            value={values.revenue.value}
            accent="from-rose-500 to-pink-500"
          />
        </div>
      )}

      {error && (
        <div className="mt-3 text-sm text-red-600">Failed to load metrics: {error}</div>
      )}
    </div>
  );
};

export default AdminHomeKPIs;
