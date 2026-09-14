// ModuleItem.tsx
import React from "react";
import { motion } from "framer-motion";
import { BookOpenIcon, PlayIcon } from "@heroicons/react/24/outline";

interface Lesson {
  _id: string;
  title: string;
  type: 'text' | 'code' | 'video';
  codeExercise?: {
    language: string;
    initialCode: string;
    expectedOutput?: string;
  };
}

interface Module {
  _id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  assessment?: {
    questions: {
      text: string;
      options: string[];
      correctAnswer: number;
    }[];
  };
}

interface ModuleItemProps {
  module: Module;
  moduleIndex: number;
  expanded: boolean;
  toggleModule: (moduleId: string) => void;
  startLesson: (moduleId: string, lessonIndex: number) => void;
  startAssessment: (moduleId: string) => void;
  unlocked: boolean;
}

const ModuleItem: React.FC<ModuleItemProps> = ({
  module,
  moduleIndex,
  expanded,
  toggleModule,
  startLesson,
  startAssessment,
  unlocked,
}) => {
  return (
    <motion.div
      className="border rounded-lg overflow-hidden bg-white shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: moduleIndex * 0.1 }}
    >
      <button
        onClick={() => toggleModule(module._id)}
        className="w-full p-4 flex justify-between items-center hover:bg-gray-50"
      >
        <div className="flex items-center">
          <i
            className={`fas fa-chevron-${
              expanded ? 'down' : 'right'
            } mr-2`}
          />
          <h3 className="text-lg font-semibold">{module.title}</h3>
        </div>
        <span className="text-sm text-gray-500">
          {module.lessons.length} lessons
        </span>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t"
        >
          <div className="p-4">
            <p className="text-gray-600 mb-4">{module.description}</p>
            <div className="space-y-2">
              {module.lessons.map((lesson, lessonIndex) => {
                const lessonUnlocked = lessonIndex === 0 ? unlocked : true;
                return (
                  <div
                    key={lesson._id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                  >
                    <div className="flex items-center">
                      <PlayIcon className="w-5 h-5 text-blue-600 mr-2" />
                      <span>{lesson.title}</span>
                    </div>
                    <button
                      onClick={() => startLesson(module._id, lessonIndex)}
                      disabled={!lessonUnlocked}
                      className={`px-3 py-1 text-sm rounded ${
                        lessonUnlocked
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {lessonUnlocked ? 'Start' : 'Locked'}
                    </button>
                  </div>
                );
              })}
            </div>

            {module.assessment && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center">
                <BookOpenIcon className="w-5 h-5 text-purple-500" />
                <div className="flex-1 text-left">
                  <h4 className="font-medium">Module Assessment</h4>
                  <p className="text-sm text-gray-600">
                    Questions: {module.assessment.questions.length}
                  </p>
                </div>
                <button
                  onClick={() => startAssessment(module._id)}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Start Assessment
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ModuleItem;
