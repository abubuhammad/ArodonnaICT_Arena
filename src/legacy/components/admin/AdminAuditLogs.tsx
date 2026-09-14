import React from 'react';
import useAuditLogs from '../../hooks/useAuditLogs';

const AdminAuditLogs: React.FC = () => {
  const { items, loading, error, refresh } = useAuditLogs({ limit: 12 });

  return (
    <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-sm p-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Audit Logs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Recent administrative actions (immutable).</p>
        </div>
        <div>
          <button
            onClick={() => refresh()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-500">No audit logs yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left">Time</th>
                <th className="px-3 py-2 text-left">Actor</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Resource</th>
                <th className="px-3 py-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
              {items.map((log, index) => {
                const key = log._id || `${log.actionType}-${log.resourceType}-${log.createdAt || 'unknown'}-${index}`;
                return (
                  <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{log.actorRole ? `${log.actorRole} (${log.actorId || '—'})` : (log.actorId || 'System')}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{log.actionType}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{log.resourceType}{log.resourceId ? ` (${log.resourceId})` : ''}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 break-words max-w-lg">{typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
