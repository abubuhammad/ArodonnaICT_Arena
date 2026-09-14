import React from "react";

interface SkeletonCourseProps {
  count?: number;
}

const SkeletonCourse: React.FC<SkeletonCourseProps> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow animate-pulse">
          {/* Thumbnail skeleton */}
          <div className="w-full h-40 bg-gray-300 dark:bg-gray-700" />
          
          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
            
            {/* Description lines */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
            </div>
            
            {/* Badges */}
            <div className="flex gap-2">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-16" />
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-16" />
            </div>
            
            {/* Price + Button */}
            <div className="flex justify-between items-center pt-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20" />
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-24" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default SkeletonCourse;
