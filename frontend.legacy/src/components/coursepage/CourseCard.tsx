import React from 'react';
import { Link } from 'react-router-dom';

interface CourseCardProps {
  course: {
    _id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    isFree: boolean;
    enrolledStudents: string[];
    instructor: {
      name: string;
      title?: string;
      avatar?: string;
    };
    thumbnail?: string;
  };
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const instructor = course.instructor || { name: 'Unknown Instructor', avatar: '/images/default-avatar.png' };
  const avatarSrc = instructor.avatar || '/images/default-avatar.png';
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/courses/${course._id}`}>
        <div className="relative h-48">
          <img
            src={course.thumbnail || '/images/course-default.jpg'}
            alt={course.title}
            className="w-full h-full object-cover"
          />
          {course.isFree && (
            <span className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
              Free
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {course.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {course.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src={avatarSrc}
                alt={instructor.name}
                className="w-8 h-8 rounded-full mr-2"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {instructor.name}
                </p>
                {instructor.title && (
                  <p className="text-xs text-gray-500">{instructor.title}</p>
                )}
              </div>
            </div>
            {!course.isFree && (
              <span className="text-lg font-semibold text-gray-900">
                ${course.price}
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>{course.enrolledStudents.length} students</span>
            <span className="capitalize">{course.category}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}; 