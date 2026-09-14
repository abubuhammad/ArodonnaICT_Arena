import React from "react";
import { motion } from "framer-motion";

interface CourseProgressProps {
  progress: number;
}

const CourseProgress: React.FC<CourseProgressProps> = ({ progress }) => {
  // Determine label based on progress
  let progressLabel = "";
  if (progress === 0) {
    progressLabel = "Start your course";
  } else if (progress > 0 && progress < 100) {
    progressLabel = `You're ${progress}% through. Resume learning!`;
  } else if (progress === 100) {
    progressLabel = "Course Completed!";
  }

  // Choose a progress bar color based on progress state.
  const progressBarColor =
    progress === 100 ? "bg-green-600" : progress > 0 ? "bg-purple-600" : "bg-blue-600";

  return (
    <motion.div
      className="mt-6 p-6 bg-white rounded-lg shadow-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-lg font-semibold mb-4">Course Progress</h2>
      <div className="relative w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`${progressBarColor} h-2.5 rounded-full transition-all duration-300`}
          style={{ width: `${progress}%` }}
        ></div>
        {progress > 0 && (
          <div
            className="absolute -top-6 text-sm font-medium text-gray-700"
            style={{ left: `${progress}%`, transform: "translateX(-50%)" }}
          >
            {progress}%
          </div>
        )}
      </div>
      {progressLabel && (
        <p className="mt-2 text-sm text-gray-600">
          {progressLabel}
        </p>
      )}
    </motion.div>
  );
};

export default CourseProgress;
