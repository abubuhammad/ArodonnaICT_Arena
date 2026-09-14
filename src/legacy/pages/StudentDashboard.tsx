import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { logoutUser } from "../store/slices/authSlice";
import { RootState } from "../store";
import api from "../utils/api";
import { StudentStats, Certificate, Course } from "../types";
import DashboardHeader from "../components/student/DashboardHeader";
import StatsCardsSection from "../components/student/StatsCardsSection";
import CourseTabs, { TabType } from "../components/student/CourseTabs";
import { AchievementsSection } from "../components/student/AchievementsSection";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

interface ApiError {
  response?: {
    status: number;
    data?: any;
  };
  message: string;
}

const StudentDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('enrolled');

  const parseDurationHours = (duration: string | undefined | null): number => {
    if (!duration) return 0;
    const lower = duration.toLowerCase();
    const num = parseFloat(lower.replace(/[^0-9.]/g, " ").split(" ")[0] || "0");
    if (lower.includes("min")) return num / 60;
    return isNaN(num) ? 0 : num; // default assume hours
  };

  const handleEnrollment = (courseId: string) => {
    if (!courseId) {
      alert('Missing course id. Please refresh.');
      return;
    }
    navigate(`/courses/${courseId}/enroll`);
  };

  const fetchStudentData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
  
      console.log("🚀 Fetching student data...");
      console.log("📡 Requesting Student Stats: /students/stats/", user?.id);
      console.log("📡 Requesting Enrolled Courses: /students/courses/enrolled");
      console.log("📡 Requesting Available Courses: /courses");
      console.log("📡 Requesting Certificates: /students/certificates");
  
      const [statsRes, enrolledRes, availableRes, certificatesRes] = await Promise.all([
        api.get<StudentStats>(`/students/stats/${user?.id}`, { headers }),
        api.get<Course[]>(`/students/courses/enrolled`, { headers }),
        api.get<Course[]>('/courses', { headers }),
        api.get<Certificate[]>(`/students/certificates`, { headers })
      ]);
  
      console.log("✅ Student Stats Response:", JSON.stringify(statsRes.data, null, 2));
      console.log("✅ Enrolled Courses Response:", JSON.stringify(enrolledRes.data, null, 2));
      console.log("✅ Available Courses Response:", JSON.stringify(availableRes.data, null, 2));
      console.log("✅ Certificates Response:", JSON.stringify(certificatesRes.data, null, 2));
  
      let processedEnrolledCourses: Course[] = [];

      // Check if enrolledRes.data is an array and has items
      if (!Array.isArray(enrolledRes.data)) {
        console.error("❌ Enrolled courses data is not an array:", enrolledRes.data);
        setEnrolledCourses([]);
      } else {
        // Process enrolled courses
        processedEnrolledCourses = enrolledRes.data.map(course => {
          const id = (course as any)?._id || (course as any)?.id || (course as any)?.courseId;
          console.log("Processing enrolled course:", course);
          return {
            ...course,
            thumbnail: course.thumbnail || '/images/course-default.jpg',
            progress: course.progressPercentage || 0,
            status: course.enrollmentStatus || 'not-started',
            _id: id,
            id,
            title: course.title || 'Untitled Course',
            description: course.description || '',
            price: course.price || 0,
            isFree: course.isFree || false,
            instructor: course.instructor || 'Unknown Instructor',
            level: course.level || 'Beginner',
            duration: course.duration || '0 hours',
            category: course.category || 'Uncategorized',
            lastAccessed: course.lastAccessed,
            enrollmentStatus: course.enrollmentStatus
          } as Course;
        });

        console.log("Processed enrolled courses:", JSON.stringify(processedEnrolledCourses, null, 2));
        setEnrolledCourses(processedEnrolledCourses);
      }

      // Process available courses
      if (!Array.isArray(availableRes.data)) {
        console.error("❌ Available courses data is not an array:", availableRes.data);
        setAvailableCourses([]);
      } else {
        const processedAvailableCourses = availableRes.data.map((course: any) => {
          console.log("Processing available course:", course);
          const id = course._id || course.id;
          return {
            ...course,
            thumbnail: course.thumbnail || '/images/course-default.jpg',
            _id: id,
            id,
            title: course.title || 'Untitled Course',
            description: course.description || '',
            price: course.price || 0,
            isFree: course.isFree || false,
            instructor: course.instructor || 'Unknown Instructor',
            level: course.level || 'Beginner',
            duration: course.duration || '0 hours',
            category: course.category || 'Uncategorized'
          } as Course;
        });

        console.log("Processed available courses:", JSON.stringify(processedAvailableCourses, null, 2));
        setAvailableCourses(processedAvailableCourses);
      }
  
      // Derive learning hours from enrolled courses progress × duration, fallback to backend value
      const derivedHours = (processedEnrolledCourses || []).reduce((sum, c) => {
        const progress = (c as any).progress || (c as any).progressPercentage || 0;
        const hours = parseDurationHours(c.duration);
        return sum + (hours * (progress / 100));
      }, 0);

      const useDerived = (processedEnrolledCourses || []).length > 0;
      const totalHours = useDerived ? derivedHours : (statsRes.data?.totalHoursLearned || 0);

      setStats({
        ...statsRes.data,
        totalHoursLearned: Number((totalHours || 0).toFixed(1)),
      });
      setCertificates(certificatesRes.data);
    } catch (error) {
      console.error("❌ Error fetching student data:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);
  
  useEffect(() => {
    if (user?.id) {
      fetchStudentData();
    }
  }, [user?.id, fetchStudentData]);

  const handleViewCertificate = (certificateId?: string) => {
    if (certificateId) {
      handleCertificateDownload(certificateId);
    }
  };

  const handleCertificateDownload = async (certificateId: string) => {
    try {
      const response = await api.get(`/certificates/${certificateId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${certificateId}.pdf`;
      link.click();
    } catch (error) {
      console.error('Certificate download failed:', error);
    }
  };

  const handleCertificateShare = async (certificateId: string) => {
    try {
      const shareUrl = `${window.location.origin}/api/certificates/${certificateId}/download`;
      await navigator.share({
        title: 'My Certificate',
        text: 'Check out my achievement!',
        url: shareUrl
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-6">
      <DashboardHeader userName={user?.name || "Student"} />
      <StatsCardsSection stats={stats} />
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="learning-progress">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="learning-progress" className="text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Learning progress</h2>
            <p className="mt-2 text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">Keep building momentum across your enrolled courses.</p>
          </div>
          <p className="text-sm font-medium leading-5 text-indigo-600 dark:text-indigo-400">{stats?.averageProgress || 0}% complete</p>
        </div>
        <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={stats?.averageProgress || 0} aria-label="Overall learning progress">
          <div className="h-full rounded-full bg-indigo-600 transition-[width] duration-300 dark:bg-indigo-400" style={{ width: `${Math.min(Math.max(stats?.averageProgress || 0, 0), 100)}%` }} />
        </div>
        <div className="mt-4 flex flex-col gap-2 text-sm font-normal leading-5 text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>{stats?.totalHoursLearned || 0} hours spent learning</span>
          <span>{stats?.coursesCompleted || 0} courses completed</span>
        </div>
      </section>
      {enrolledCourses.length === 0 && (
        <section className="py-12 text-center" aria-labelledby="enrollment-empty-state">
          <h2 id="enrollment-empty-state" className="text-lg font-semibold leading-7 text-slate-950 dark:text-slate-50">Your learning journey starts here</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">You are not enrolled in any courses yet. Explore the catalogue and choose a course to begin.</p>
          <button type="button" onClick={() => navigate('/courses')} className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium leading-5 text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950">Explore courses</button>
        </section>
      )}
      <CourseTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        enrolledCourses={enrolledCourses}
        availableCourses={availableCourses}
        certificates={certificates}
        onContinue={(courseId: string) => navigate(`/courses/${courseId}`)}
        onEnroll={handleEnrollment}
        onViewCertificate={handleViewCertificate}
        onDownloadCertificate={handleCertificateDownload}
        onShareCertificate={handleCertificateShare}
        navigate={navigate}
      />
      <AchievementsSection achievements={stats?.achievements || 0} />
    </div>
  );
};

export default StudentDashboard;
