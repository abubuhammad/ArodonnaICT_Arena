// src/components/courses/CourseCardSmall.tsx
import React from 'react';
import { Button } from '../ui/button';

interface CourseSmallProps {
  course: {
    _id: string;
    title: string;
    description?: string;
    price: number;
    isFree: boolean;
    instructor?: string | { _id?: string; id?: string; name?: string; locale?: string; currency?: string };
    level?: string;
    duration?: string;
    thumbnail?: string;
  };
  onEnroll: (courseId: string) => void | Promise<void>;
  onViewCourse?: (courseId: string) => void;
  locale?: string;
  currencyCode?: string;
  currentUserId?: string;
  currentUserRole?: string;
}

const CourseCardSmall: React.FC<CourseSmallProps> = ({ course, onEnroll, onViewCourse, locale, currencyCode, currentUserId, currentUserRole }) => {
  const instructorName = typeof course.instructor === 'object'
    ? (course.instructor?.name || 'Unknown')
    : (course.instructor || 'Unknown');

  // Get instructor id for ownership checks - handle both _id and id properties
  let courseInstructorId = '';
  if (typeof course.instructor === 'object' && course.instructor) {
    courseInstructorId = (course.instructor._id || course.instructor.id || '').toString();
  } else if (typeof course.instructor === 'string') {
    courseInstructorId = course.instructor;
  }

  // Normalize user ID for comparison
  const normalizedUserId = currentUserId ? String(currentUserId) : '';

  // Check if current user owns this course (only if logged in and IDs match)
  const ownsThisCourse = !!(normalizedUserId && courseInstructorId && courseInstructorId === normalizedUserId);

  // prefer instructor's locale/currency when available
  const instructorObj = typeof course.instructor === 'object' ? (course.instructor as any) : null;
  const preferredLocale = instructorObj?.locale || locale;
  const preferredCurrency = instructorObj?.currency || currencyCode;

  const detectCurrencyForLocale = (loc?: string) => {
    const l = (loc || (typeof navigator !== 'undefined' && navigator.language) || 'en-US').toLowerCase();
    if (l.includes('en-us')) return 'USD';
    if (l.includes('en-gb')) return 'GBP';
    if (l.includes('en-ng') || l.includes('ng')) return 'NGN';
    if (l.includes('en-in') || l.includes('in')) return 'INR';
    if (l.includes('en-ca')) return 'CAD';
    if (l.includes('en-au')) return 'AUD';
    if (l.includes('fr') || l.includes('de') || l.includes('es')) return 'EUR';
    return 'USD';
  };

  const formatPrice = (price: number) => {
    const currency = preferredCurrency || detectCurrencyForLocale(preferredLocale || locale);
    const lf = preferredLocale || locale;
    try {
      const val = Number(price);
      const safeVal = Number.isFinite(val) ? val : 0;
      return new Intl.NumberFormat(lf || undefined, { style: 'currency', currency }).format(safeVal);
    } catch (e) {
      const safeVal = Number.isFinite(Number(price)) ? Number(price) : 0;
      return `${currency} ${safeVal.toFixed(2)}`;
    }
  };

  const priceDisplay = course.isFree ? 'Free' : formatPrice(course.price || 0);

  return (
    <div
      className="group rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 shadow-sm hover:shadow-md transition overflow-hidden cursor-pointer"
      onClick={() => onViewCourse?.(course._id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onViewCourse?.(course._id);
        }
      }}
      role={onViewCourse ? 'link' : undefined}
      tabIndex={onViewCourse ? 0 : undefined}
    >
      <div className="flex gap-3">
        <div className="w-24 h-16 rounded-md overflow-hidden ring-1 ring-slate-200 dark:ring-gray-800 flex-shrink-0">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-100 dark:bg-gray-800" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {course.title}
          </h4>
          <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-slate-600 dark:text-gray-300">
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
              {course.level || 'Beginner'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
              {course.duration || 'N/A'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 truncate">
              {instructorName}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-[12px] font-medium text-slate-700 dark:text-gray-200">
          {priceDisplay}
        </div>
        {ownsThisCourse ? (
          <div className="text-[11px] text-slate-500">You own this</div>
        ) : (
          <Button
            onClick={(event) => {
              event.stopPropagation();
              onEnroll((course as any)._id || (course as any).id);
            }}
            className="h-8 px-3 text-xs"
          >
            {course.isFree ? 'Enroll' : 'Enroll'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CourseCardSmall;
