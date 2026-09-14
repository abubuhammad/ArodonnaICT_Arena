// src/components/sections/FeaturedCarousel.tsx
import React from 'react';
import { motion } from 'framer-motion';
import CourseCard from '../courses/CourseCard';
import { Course } from '../../types';

interface Props {
  courses: Course[];
  onEnroll: (courseId: string) => void | Promise<void>;
  user?: { role: string; _id?: string; id?: string } | null;
}

const FeaturedCarousel: React.FC<Props> = ({ courses, onEnroll, user }) => {
  return (
    <div className="relative">
      <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-2">
        {courses.map((course) => (
          <motion.div
            key={course._id}
            className="min-w-[300px] max-w-[320px] snap-start"
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <CourseCard
              course={course}
              onEnroll={onEnroll}
              isAuthenticated={!!user}
              currentUserRole={(user?.role as any) || 'student'}
              currentUserId={(user?.id || user?._id || '') as string}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedCarousel;
