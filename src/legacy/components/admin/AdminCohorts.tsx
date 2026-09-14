import React from 'react';
import useCohortsData from '../../hooks/useCohortsData';
import SkeletonLoader from '../ui/SkeletonLoader';

const AdminCohorts: React.FC<{ weeks?: number; tenantId?: string }> = ({ weeks = 8, tenantId }) => {
  const { data, loading, error, refresh } = useCohortsData({ weeks, tenantId });

  if (loading) return <SkeletonLoader lines={4} />;
  if (error)
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-600 dark:text-red-300">{error}</div>
    );

  const cohorts = data?.cohorts || [];

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold text-slate-900 dark:text-slate-100">Cohort Retention</h4>
        <div className="text-sm text-slate-500">
          <button onClick={refresh} className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800">Refresh</button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left">Cohort Start</th>
              <th className="px-3 py-2 text-center">Enrolled</th>
              <th className="px-3 py-2 text-center">% 1w</th>
              <th className="px-3 py-2 text-center">% 2w</th>
              <th className="px-3 py-2 text-center">% 4w</th>
              <th className="px-3 py-2 text-center">% 8w</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-950 divide-y divide-slate-200 dark:divide-slate-800">
            {cohorts.map((c) => (
              <tr key={c.cohortStart} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                <td className="px-3 py-2 font-medium">{c.cohortStart}</td>
                <td className="px-3 py-2 text-center">{c.totalEnrolled}</td>
                <td className="px-3 py-2 text-center">{c.pctWithin1Week.toFixed(1)}%</td>
                <td className="px-3 py-2 text-center">{c.pctWithin2Weeks.toFixed(1)}%</td>
                <td className="px-3 py-2 text-center">{c.pctWithin4Weeks.toFixed(1)}%</td>
                <td className="px-3 py-2 text-center">{c.pctWithin8Weeks.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCohorts;
