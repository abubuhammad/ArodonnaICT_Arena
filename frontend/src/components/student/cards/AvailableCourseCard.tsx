import React from 'react';
import { motion } from 'framer-motion';
import { Course } from '../../../types';
import { Image } from '../../ui/Image';

interface AvailableCourseCardProps {
course: Course;
onEnroll: (courseId: string) => void;
}

const AvailableCourseCard: React.FC<AvailableCourseCardProps> = ({ course, onEnroll }) => {
  const cid = (course as any)._id || (course as any).id;

return (
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
<p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
<div className="flex flex-wrap gap-2 mb-4">
<span className="text-sm bg-gray-100 px-2 py-1 rounded">{course.level}</span>
  <span className="text-sm bg-gray-100 px-2 py-1 rounded">{course.duration}</span>
</div>
<div className="flex justify-between items-center">
<span className="text-lg font-bold text-gray-900">
  {course.isFree ? "Free" : `₦${course.price}`}
</span>
<button
disabled={!cid}
  onClick={() => cid && onEnroll(cid)}
className="bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
>
    Enroll Now
    </button>
    </div>
    </div>
    </motion.div>
  );
};

export default AvailableCourseCard;