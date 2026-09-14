import React from 'react';

interface CourseEarnings {
  courseId: string;
  title: string;
  instructorEarnings: number; // stored in smallest currency unit
  platformEarnings: number;
  enrollments: number;
}

interface Props {
  totalInstructorEarnings: number;
  totalPlatformEarnings: number;
  courses: CourseEarnings[];
  locale?: string; // optional locale to format currency
  currencyCode?: string; // optional currency ISO code (e.g., USD, NGN)
}

const getCurrencyForLocale = (locale?: string) => {
  const loc = (locale || (typeof navigator !== 'undefined' && navigator.language) || 'en-US').toLowerCase();
  if (loc.includes('en-us')) return 'USD';
  if (loc.includes('en-gb')) return 'GBP';
  if (loc.includes('en-ng') || loc.includes('ng')) return 'NGN';
  if (loc.includes('en-in') || loc.includes('in')) return 'INR';
  if (loc.includes('en-ca')) return 'CAD';
  if (loc.includes('en-au')) return 'AUD';
  if (loc.includes('fr') || loc.includes('de') || loc.includes('es')) return 'EUR';
  return 'USD';
};

const formatCurrency = (valueInSmallestUnit: number, locale?: string, currencyCode?: string) => {
  const amount = (valueInSmallestUnit || 0) / 100; // convert to major unit
  const currency = currencyCode || getCurrencyForLocale(locale);
  try {
    return new Intl.NumberFormat(locale || undefined, { style: 'currency', currency }).format(amount);
  } catch (e) {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const EarningsCard: React.FC<Props> = ({ totalInstructorEarnings, totalPlatformEarnings, courses, locale, currencyCode }) => {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4">
      <h3 className="text-md font-semibold">Earnings</h3>
      <p className="text-sm text-slate-500">Summary of instructor earnings (based on recorded enrollments)</p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 rounded-md bg-emerald-50">
          <div className="text-xs text-slate-600">Your Earnings</div>
          <div className="text-2xl font-bold">{formatCurrency(totalInstructorEarnings || 0, locale, currencyCode)}</div>
        </div>
        <div className="p-3 rounded-md bg-slate-50">
          <div className="text-xs text-slate-600">Platform Earnings</div>
          <div className="text-2xl font-bold">{formatCurrency(totalPlatformEarnings || 0, locale, currencyCode)}</div>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-semibold">Per Course</h4>
        <div className="mt-2 space-y-2">
          {courses.map((c) => (
            <div key={c.courseId} className="flex justify-between items-center p-2 rounded-md border border-slate-100">
              <div>
                <div className="text-sm font-medium">{c.title || 'Untitled course'}</div>
                <div className="text-xs text-slate-500">{c.enrollments} enrollments</div>
              </div>
              <div className="text-right">
                <div className="text-sm">{formatCurrency(c.instructorEarnings, locale, currencyCode)}</div>
                <div className="text-xs text-slate-400">Platform {formatCurrency(c.platformEarnings, locale, currencyCode)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EarningsCard;
