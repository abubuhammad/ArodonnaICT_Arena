import React from 'react';
import useFunnelsData from '../../hooks/useFunnelsData';
import SkeletonLoader from '../ui/SkeletonLoader';

const AdminFunnels: React.FC<{ days?: number; tenantId?: string }> = ({ days = 30, tenantId }) => {
  const { data, loading, error, refresh } = useFunnelsData({ days, tenantId });

  if (loading) return <SkeletonLoader lines={4} />;
  if (error)
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-600 dark:text-red-300">{error}</div>
    );

  const enrolled = data?.enrolled || 0;
  const started = data?.started || 0;
  const paid = data?.paid || 0;
  const completed = data?.completed || 0;

  const pct = (n: number, denom: number) => (denom ? ((n / denom) * 100).toFixed(1) : '0.0');

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold text-slate-900 dark:text-slate-100">Enrollment Funnel</h4>
        <div className="text-sm text-slate-500">
          <button onClick={refresh} className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800">Refresh</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded bg-slate-50 dark:bg-slate-950/20">
          <p className="text-xs text-slate-500">Enrolled</p>
          <p className="text-2xl font-bold">{enrolled}</p>
        </div>
        <div className="p-3 rounded bg-slate-50 dark:bg-slate-950/20">
          <p className="text-xs text-slate-500">Started</p>
          <p className="text-2xl font-bold">{started}</p>
          <p className="text-xs text-slate-400">{pct(started, enrolled)}% of enrolled</p>
        </div>
        <div className="p-3 rounded bg-slate-50 dark:bg-slate-950/20">
          <p className="text-xs text-slate-500">Paid</p>
          <p className="text-2xl font-bold">{paid}</p>
          <p className="text-xs text-slate-400">{pct(paid, enrolled)}% of enrolled</p>
        </div>
        <div className="p-3 rounded bg-slate-50 dark:bg-slate-950/20">
          <p className="text-xs text-slate-500">Completed</p>
          <p className="text-2xl font-bold">{completed}</p>
          <p className="text-xs text-slate-400">{pct(completed, enrolled)}% of enrolled</p>
        </div>
      </div>
    </div>
  );
};

export default AdminFunnels;
