import React from "react";
import { motion } from "framer-motion";
import LessonItem from "./LessonItem";
import { Lesson } from "../../types/course";

interface LessonsSectionProps {
  lessons: Lesson[];
  moduleIndex: number;
  updateLesson: (moduleIndex: number, lessonIndex: number, data: Partial<Lesson>) => void;
  deleteLesson: (lessonIndex: number) => void;
}
const LessonsSection: React.FC<LessonsSectionProps> = ({
  lessons,
  moduleIndex,
  updateLesson,
  deleteLesson,
}) => {
  return (
    <>
      {lessons.map((lesson, lessonIndex) => (
        <motion.div
          key={lesson.id}
          className="border-l-2 border-purple-200 pl-4 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <LessonItem
            lesson={lesson}
            moduleIndex={moduleIndex}
            lessonIndex={lessonIndex}
            updateLesson={updateLesson}
          />
          <button
            type="button"
            onClick={() => deleteLesson(lessonIndex)}
            className="text-red-500 hover:text-red-700"
          >
            Delete Lesson
          </button>
        </motion.div>
      ))}
    </>
  );
};

export default LessonsSection;
