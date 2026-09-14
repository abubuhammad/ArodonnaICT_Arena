import React from "react";
import { motion } from "framer-motion";
import { XCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import LessonsSection from "./LessonsSection";
import AssessmentSection from "./AssessmentSection";
import { Module, Lesson } from "../../types/course";

interface ModuleItemProps {
  module: Module;
  moduleIndex: number;
  updateModule: (moduleIndex: number, data: Partial<Module>) => void;
  addLessonToModule: (moduleIndex: number) => void;
  updateLesson: (moduleIndex: number, lessonIndex: number, data: Partial<Lesson>) => void;
  addAssessmentToModule: (moduleIndex: number) => void;
  deleteModule: (moduleIndex: number) => void;
}

const ModuleItem: React.FC<ModuleItemProps> = ({
  module,
  moduleIndex,
  updateModule,
  addLessonToModule,
  updateLesson,
  addAssessmentToModule,
  deleteModule,
}) => {
  return (
    <motion.div
      className="border rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mb-4">
        <input
          type="text"
          value={module.title}
          onChange={(e) =>
            updateModule(moduleIndex, { title: e.target.value })
          }
          placeholder="Module Title"
          className="w-full p-2 border rounded-lg mb-2"
          required
        />
        <textarea
          value={module.description}
          onChange={(e) =>
            updateModule(moduleIndex, { description: e.target.value })
          }
          placeholder="Module Description"
          className="w-full p-2 border rounded-lg h-20"
          required
        />
      </div>
      {/* Lessons Section */}
      <div className="ml-4 mb-4">
        <h3 className="text-lg font-medium mb-2">Lessons</h3>
        <LessonsSection
          lessons={module.lessons}
          moduleIndex={moduleIndex}
          updateLesson={updateLesson}
          deleteLesson={(lessonIndex) => {
            const updatedLessons = module.lessons.filter(
              (_, idx) => idx !== lessonIndex
            );
            updateModule(moduleIndex, { lessons: updatedLessons });
          }}
        />
        <button
          type="button"
          onClick={() => addLessonToModule(moduleIndex)}
          className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 ml-2"
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span>Add Lesson</span>
        </button>
      </div>
      {/* Assessment Section */}
      <div className="ml-4">
        <h3 className="text-lg font-medium mb-2">Module Assessment</h3>
        <AssessmentSection
          module={module}
          moduleIndex={moduleIndex}
          updateModule={updateModule}
          addAssessmentToModule={addAssessmentToModule}
        />
      </div>
      {/* Module Delete Button */}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => deleteModule(moduleIndex)}
          className="text-red-500 hover:text-red-700 flex items-center space-x-2"
        >
          <XCircleIcon className="w-5 h-5" />
          <span>Delete Module</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ModuleItem;
