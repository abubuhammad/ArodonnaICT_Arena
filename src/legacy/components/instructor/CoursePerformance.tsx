import React from "react";

interface Course {
  _id: string;
  title: string;
  enrolledStudents: string[];
  completedStudents: string[];
  rating: number;
  revenue: number;
}

interface CoursePerformanceProps {
  courses: Course[];
}

const CoursePerformance: React.FC<CoursePerformanceProps> = ({ courses }) => (
  <div className="bg-white rounded-xl shadow-md p-6 mb-8">
    <h2 className="text-2xl font-semibold mb-4">Course Performance</h2>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-4">Course</th>
            <th className="text-center">Enrolled</th>
            <th className="text-center">Completed</th>
            <th className="text-center">Completion Rate</th>
            <th className="text-center">Rating</th>
            <th className="text-right">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course._id} className="border-b hover:bg-gray-50">
              <td className="py-4">{course.title}</td>
              <td className="text-center">{course.enrolledStudents.length}</td>
              <td className="text-center">{course.completedStudents.length}</td>
              <td className="text-center">
                {course.enrolledStudents.length > 0
                  ? `${(
                      (course.completedStudents.length /
                        course.enrolledStudents.length) *
                      100
                    ).toFixed(1)}%`
                  : "0%"}
              </td>
              <td className="text-center">{course.rating.toFixed(1)}</td>
              <td className="text-right">${course.revenue.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default CoursePerformance;
