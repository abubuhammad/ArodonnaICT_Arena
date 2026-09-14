import React, { useEffect, useState, useCallback } from 'react';
import adminApi from '../../utils/adminApi';
import SkeletonLoader from '../ui/SkeletonLoader';

interface CertificateRow {
  enrollmentId: string;
  user?: { id: string; name?: string; email?: string; role?: string };
  course?: { id: string; title?: string };
  status?: string;
  certificate?: { id?: string; issuedAt?: string; downloadUrl?: string };
  issuedAt?: string;
}

const CertificatesList: React.FC = () => {
  const [rows, setRows] = useState<CertificateRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get('/admin/certificates');
      const data = Array.isArray(res.data?.certificates) ? res.data.certificates : [];
      setRows(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load certificates');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  if (loading) return <SkeletonLoader lines={4} />;

  if (error)
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-600 dark:text-red-300">
        {error}
      </div>
    );

  if (!rows.length) return <div className="text-sm text-slate-500">No certificates issued yet.</div>;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300">
          <tr>
            <th className="px-4 py-3 text-left">User</th>
            <th className="px-4 py-3 text-left">Course</th>
            <th className="px-4 py-3 text-left">Issued</th>
            <th className="px-4 py-3 text-left">Certificate</th>
            <th className="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
          {rows.map((row) => (
            <tr key={row.enrollmentId} className="hover:bg-slate-50 dark:hover:bg-slate-900">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900 dark:text-slate-100">{row.user?.name || 'User'}</div>
                <div className="text-xs text-slate-500">{row.user?.email}</div>
              </td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.course?.title || 'Course'}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                {row.certificate?.issuedAt ? new Date(row.certificate.issuedAt).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3">
                {row.certificate?.downloadUrl ? (
                  <a
                    href={row.certificate.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 text-sm underline"
                  >
                    Download
                  </a>
                ) : (
                  <span className="text-xs text-slate-500">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Issued
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CertificatesList;
