import React from "react";

interface Course {
  _id: string;
  title: string;
  enrolledStudents: string[];
}

interface EnrollmentProgress {
  enrollmentId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  courseId: string;
  enrolledAt: string;
  progress: {
    status: "completed" | "in-progress" | "not-started";
    completedLessons: number;
    totalLessons: number;
  };
}

interface RecentActivitiesProps {
  courses: Course[];
  enrollmentProgress: EnrollmentProgress[];
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({
  courses,
  enrollmentProgress,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Recent Enrollments</h2>
      <div className="space-y-4">
        {courses.slice(0, 5).map((course) => (
          <div key={course._id} className="flex justify-between items-center">
            <span>{course.title}</span>
            <span className="text-gray-600">
              {course.enrolledStudents.length} students
            </span>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Student Progress</h2>
      <div className="space-y-4">
        {enrollmentProgress.slice(0, 5).map((enrollment) => (
          <div key={enrollment.enrollmentId} className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">{enrollment.userId.name}</span>
              <span className="text-sm text-gray-600">
                {enrollment.progress.completedLessons} /{" "}
                {enrollment.progress.totalLessons} lessons
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${
                    (enrollment.progress.completedLessons /
                      enrollment.progress.totalLessons) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default RecentActivities;
