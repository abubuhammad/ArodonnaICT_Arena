import React from 'react';
import { motion } from 'framer-motion';
import { Course } from '../../types';
import { Image } from '../ui/Image';

interface CourseCardProps {
  course: Course;
  onContinue: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onContinue }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-white rounded-xl shadow-md overflow-hidden"
  >
    <Image
      src={course.thumbnail}
      alt={course.title}
      type="course"
      className="w-full h-48 object-cover"
    />
    <div className="p-4">
      <h3 className="font-semibold mb-2">{course.title}</h3>
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${course.progress || 0}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-1">{course.progress || 0}% Complete</p>
      </div>
      <button
        onClick={onContinue}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Continue Learning
      </button>
    </div>
  </motion.div>
);

export default CourseCard;
