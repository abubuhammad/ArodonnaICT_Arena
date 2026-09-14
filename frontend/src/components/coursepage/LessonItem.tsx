// LessonItem.tsx
import React from "react";
import { motion } from "framer-motion";
import { VideoCameraIcon, DocumentTextIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface Lesson {
  title: string;
  description: string;
  lessonType: "text-only" | "text-and-video";
  content: string;
  videoUrl?: string;
  duration?: string;
  order: number;
  completed: boolean;
}

interface LessonItemProps {
  moduleId: string;
  lesson: Lesson;
  lessonIndex: number;
  startLesson: (moduleId: string, lessonIndex: number) => void;
  unlocked: boolean;
}

const LessonItem: React.FC<LessonItemProps> = ({
  moduleId,
  lesson,
  lessonIndex,
  startLesson,
  unlocked,
}) => {
  return (
    <motion.button
      onClick={() => {
        if (unlocked) {
          startLesson(moduleId, lessonIndex);
        }
      }}
      disabled={!unlocked}
      className={`w-full flex items-center space-x-4 p-4 rounded-lg transition-colors ${
        !unlocked ? "bg-gray-200 cursor-not-allowed opacity-60" : "hover:bg-gray-50"
      }`}
      whileHover={{ scale: unlocked ? 1.02 : 1 }}
    >
      {lesson.lessonType === "text-and-video" ? (
        <VideoCameraIcon className="w-5 h-5 text-purple-500" />
      ) : (
        <DocumentTextIcon className="w-5 h-5 text-purple-500" />
      )}
      <div className="flex-1 text-left">
        <h4 className="font-medium">{lesson.title}</h4>
        <p className="text-sm text-gray-600">{lesson.description}</p>
      </div>
      {lesson.completed && (
        <CheckCircleIcon className="w-5 h-5 text-green-500" />
      )}
    </motion.button>
  );
};

export default LessonItem;
