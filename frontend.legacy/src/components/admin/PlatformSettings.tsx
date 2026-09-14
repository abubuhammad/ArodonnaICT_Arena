import React, { useEffect, useState } from 'react';
import adminApi from '../../utils/adminApi';

const PlatformSettings: React.FC = () => {
  const [platformSharePercent, setPlatformSharePercent] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await adminApi.get('/courses/settings');
        setPlatformSharePercent(res.data?.platformSharePercent ?? 20);
      } catch (err: any) {
        setError(err?.response?.data?.error || err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.put('/courses/settings', { platformSharePercent });
      setSuccess('Settings updated');
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4">
      <h3 className="text-md font-semibold">Platform Revenue Share</h3>
      <p className="text-sm text-slate-500">Set platform's percentage share for paid enrollments.</p>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={100}
          value={platformSharePercent}
          onChange={(e) => setPlatformSharePercent(Number(e.target.value))}
          className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm w-28"
        />
        <span className="text-sm">% (platform)</span>
        <button
          onClick={save}
          disabled={saving}
          className="ml-4 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-indigo-600 text-white text-sm"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
      {success && <div className="text-sm text-emerald-600 mt-2">{success}</div>}
    </div>
  );
};

export default PlatformSettings;
