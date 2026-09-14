import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  instructor: string | { _id: string; name: string };
  level: string;
  duration: string;
  thumbnail?: string;
}

interface Enrollment {
  _id: string;
  userId: string;
  courseId: {
    _id: string;
    title: string;
  };
  status: "pending" | "enrolled" | "in-progress" | "completed";
  paymentStatus: "not-paid" | "pending" | "paid";
  progress: number;
}

interface CourseCardProps {
  course: Course;
  enrollments?: Enrollment[];
  onEnrollmentChange?: () => void;
  onEnroll: (courseId: string) => Promise<void> | void;
  isAuthenticated: boolean;
  // New props for instructor vs. student handling
  currentUserRole: "student" | "instructor" | "admin" | "pending";
  currentUserId: string;
  // optional platform share percent (0-100) to compute estimated instructor share
  platformSharePercent?: number;
  // optional locale/currency hints
  locale?: string;
  currencyCode?: string;
  showInstructorEarnings?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  enrollments = [],
  onEnrollmentChange,
  onEnroll,
  isAuthenticated,
  currentUserRole,
  currentUserId,
  platformSharePercent,
  locale,
  currencyCode,
  showInstructorEarnings = true,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isInstructor = currentUserRole === "instructor";

  // normalize instructor id for ownership checks
  const courseInstructorId = React.useMemo(() => {
    if (typeof course.instructor === 'string') return course.instructor;
    if (course.instructor && typeof course.instructor === 'object') {
      return (course.instructor as any)._id || (course.instructor as any).id || '';
    }
    return '';
  }, [course.instructor]);
  // Determine enrollment status for this course.
  const enrollment = enrollments.find((e) => e.courseId._id === course._id);
  const isEnrolled = !!enrollment;
  const isPending = enrollment?.paymentStatus === "pending";
  const isCompleted = enrollment?.status === "completed";
  const progress = enrollment?.progress || 0;

  // For students: handle enrollment navigation.
  const handleEnrollment = () => {
    const cid = (course as any)?._id || (course as any)?.id;
    if (!cid) {
      setError('Missing course id. Please refresh.');
      return;
    }
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isEnrolled) {
      navigate(`/courses/${cid}/learn`);
    } else {
      navigate(`/courses/${cid}/enroll`);
    }
  };

  // For instructors: handle editing the course.
  const handleEditCourse = () => {
    navigate(`/instructor/edit-course/${course._id}`);
  };

  // Helpers for localized currency formatting and estimated instructor share
  // prefer instructor's locale/currency when available
  const instructorObj = typeof course.instructor === 'object' ? (course.instructor as any) : null;
  const preferredLocale = instructorObj?.locale || locale;
  const preferredCurrency = instructorObj?.currency || currencyCode;
  const detectCurrencyForLocale = (locale?: string) => {
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

  const formatPrice = (price: number) => {
    // assume `course.price` is in major currency units (e.g., 1000 means ₦1000)
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

  // compute estimated instructor share from course.price and platformSharePercent
  const platformPercent = typeof platformSharePercent === 'number' ? platformSharePercent : 20;
  const priceNum = Number((course as any).price) || 0;
  const estimatedInstructorShare = course.isFree ? 0 : (priceNum * (100 - platformPercent) / 100);
  // Render action button based on current user role.
  const renderActionButton = () => {
    if (isInstructor) {
      const ownsCourse = courseInstructorId ? courseInstructorId === currentUserId : true;
      return (
        <div className="w-full flex items-center justify-between gap-3">
          {showInstructorEarnings ? (
            <div className="text-left">
              <div className="text-xs text-slate-500">Est. you get</div>
              <div className="text-sm font-medium">{formatPrice(estimatedInstructorShare)}</div>
            </div>
          ) : <span />}
          <div className="ml-auto">
            <Button variant="outline" onClick={ownsCourse ? handleEditCourse : undefined} disabled={!ownsCourse}>
              Edit
            </Button>
          </div>
        </div>
      );
    }

  // For students or public users: if the current user is the course owner, show edit/earnings instead of enroll
    const ownsCourseAsStudent = Boolean(
      isAuthenticated && currentUserId && courseInstructorId && courseInstructorId === currentUserId
    );
    if (ownsCourseAsStudent) {
      return (
        <div className="w-full flex items-center justify-between gap-3">
          <div className="text-left">
            <div className="text-xs text-slate-500">Est. you get</div>
            <div className="text-sm font-medium">{formatPrice(estimatedInstructorShare)}</div>
          </div>
          <div className="ml-auto">
            <Button variant="outline" onClick={handleEditCourse}>
              Edit
            </Button>
          </div>
        </div>
      );
    }

    // Prevent students from enrolling in their own course (double check)
    if (!isInstructor && isAuthenticated && currentUserId && courseInstructorId === currentUserId) {
      return (
        <div className="w-full text-center py-2 text-xs text-slate-500">
          You own this course
        </div>
      );
    }

    return (
      <Button
        onClick={handleEnrollment}
        disabled={loading || isPending}
        className="w-full"
        variant={isEnrolled && !isPending ? "default" : course.isFree ? "default" : "outline"}
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : isPending ? (
          "Payment Pending"
        ) : isEnrolled ? (
          isCompleted ? "Review Course" : "Continue Learning"
        ) : course.isFree ? (
          "Enroll for Free"
        ) : (
          `Enroll - ${formatPrice(priceNum)}`
        )}
      </Button>
    );
  };
  return (
    <div
      onClick={isInstructor ? handleEditCourse : undefined}
      role={isInstructor ? "button" : undefined}
      tabIndex={isInstructor ? 0 : undefined}
      className="h-full flex flex-col group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/60 rounded-xl"
    >
    <Card className="h-full flex flex-col border-transparent bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_16px_50px_-12px_rgba(99,102,241,0.45)] transition">
      <div className="relative p-[1px] rounded-xl bg-gradient-to-r from-indigo-500/60 via-purple-500/60 to-emerald-500/60">
        <div className="rounded-xl bg-white dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg tracking-tight group-hover:text-indigo-700 transition">{course.title}</CardTitle>
            <div className="flex gap-2">
              {isPending && <Badge className="bg-yellow-500 text-white">Payment Pending</Badge>}
              {isCompleted && <Badge className="bg-green-500 text-white">Completed</Badge>}
            </div>
          </CardHeader>

          <CardContent className="pb-2 flex-grow">
            {course.thumbnail && (
              <div className="mb-3 overflow-hidden rounded-lg">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
            )}
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{course.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{course.level}</Badge>
              <Badge variant="outline">{course.duration}</Badge>
            </div>
            {isEnrolled && !isPending && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </CardContent>

          <CardFooter className="pt-2">
            {renderActionButton()}
          </CardFooter>
        </div>
      </div>
    </Card>
    </div>
  );
};

export default CourseCard;
