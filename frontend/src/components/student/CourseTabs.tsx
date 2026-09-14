import React from 'react';
import { BookOpen, TrendingUp, CheckCircle, Award } from "lucide-react";
import TabButton from '../ui/TabButton';
import CourseCard from './CourseCard';
import { AvailableCourseCard, CompletedCourseCard, CertificateCard } from './cards';
import { Course, Certificate } from '../../types';

export type TabType = 'enrolled' | 'available' | 'completed' | 'certificates';

interface CourseTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  enrolledCourses: Course[];
  availableCourses: Course[];
  certificates: Certificate[];
  onContinue: (courseId: string) => void;
  onEnroll: (courseId: string) => void;
  onViewCertificate: (certificateId?: string) => void;
  onDownloadCertificate: (certificateId: string) => void;
  onShareCertificate: (certificateId: string) => void;
  navigate: (path: string) => void;
}

const CourseTabs: React.FC<CourseTabsProps> = ({
  activeTab,
  setActiveTab,
  enrolledCourses,
  availableCourses,
  certificates,
  onContinue,
  onEnroll,
  onViewCertificate,
  onDownloadCertificate,
  onShareCertificate,
  navigate,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex space-x-4 mb-6">
        <TabButton
          active={activeTab === 'enrolled'}
          onClick={() => setActiveTab('enrolled')}
          icon={<BookOpen className="w-4 h-4" />}
          label="Enrolled"
        />
        <TabButton
          active={activeTab === 'available'}
          onClick={() => setActiveTab('available')}
          icon={<TrendingUp className="w-4 h-4" />}
          label="Available"
        />
        <TabButton
          active={activeTab === 'completed'}
          onClick={() => setActiveTab('completed')}
          icon={<CheckCircle className="w-4 h-4" />}
          label="Completed"
        />
        <TabButton
          active={activeTab === 'certificates'}
          onClick={() => setActiveTab('certificates')}
          icon={<Award className="w-4 h-4" />}
          label="Certificates"
        />
      </div>

      {activeTab === 'enrolled' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.length > 0 ? (
            enrolledCourses.map(course => {
              const cid = (course as any)._id || (course as any).id;
              return (
                <CourseCard
                  key={cid}
                  course={course}
                  onContinue={() => navigate(`/courses/${cid}`)}
                />
              );
            })
          ) : (
            <p className="text-gray-600 text-center w-full">You are not enrolled in any courses yet.</p>
          )}
        </div>
      )}

      {activeTab === 'available' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableCourses.map(course => (
            <AvailableCourseCard
              key={course._id}
              course={course}
              onEnroll={onEnroll}
            />
          ))}
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses
            .filter(course => course.status === 'completed')
            .map(course => (
              <CompletedCourseCard
                key={course._id}
                course={course}
                onViewCertificate={() => onViewCertificate(course.certificate?.id)}
              />
            ))}
        </div>
      )}

      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map(cert => (
            <CertificateCard
              key={cert.id}
              certificate={cert}
              onDownload={() => onDownloadCertificate(cert.id)}
              onShare={() => onShareCertificate(cert.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseTabs;
