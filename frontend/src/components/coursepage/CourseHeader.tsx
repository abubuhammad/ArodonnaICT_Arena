import React from "react";
import { motion } from "framer-motion";
import { ClockIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface CourseHeaderProps {
  title: string;
  description: string;
  totalLessons: number;
  progress?: number;
}

const CourseHeader: React.FC<CourseHeaderProps> = ({ title, description, totalLessons, progress }) => {
  return (
    <motion.div
      className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 rounded-lg shadow-md"
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
    >
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <p className="text-lg mb-4">{description}</p>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <ClockIcon className="w-5 h-5" />
          <span>{totalLessons} lessons</span>
        </div>
        {progress !== undefined && (
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="w-5 h-5" />
            <span>{progress}% Complete</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CourseHeader;
