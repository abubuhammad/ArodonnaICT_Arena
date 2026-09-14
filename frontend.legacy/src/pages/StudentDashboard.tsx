import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { logoutUser } from "../store/slices/authSlice";
import { RootState } from "../store";
import api from "../utils/api";
import { StudentStats, Certificate, Course } from "../types";
import DashboardHeader from "../components/student/DashboardHeader";
import StatsCardsSection from "../components/student/StatsCardsSection";
import ProgressSection from "../components/student/ProgressSection";
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
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DashboardHeader userName={user?.name || "Student"} />
      <StatsCardsSection stats={stats} />
      <ProgressSection stats={stats} />
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
