import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Course } from '../../../types';

interface CompletedCourseCardProps {
  course: Course;
  onViewCertificate: (certificateId?: string) => void;
}

const CompletedCourseCard: React.FC<CompletedCourseCardProps> = ({ course, onViewCertificate }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-white rounded-xl shadow-md overflow-hidden"
  >
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{course.title}</h3>
        <CheckCircle className="w-6 h-6 text-green-500" />
      </div>
      <p className="text-gray-600 mb-4">Completed on {course.completionDate?.toLocaleDateString()}</p>
      <button
        onClick={() => onViewCertificate(course.certificate?.id)}
        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
      >
        View Certificate
      </button>
    </div>
  </motion.div>
);

export default CompletedCourseCard;
