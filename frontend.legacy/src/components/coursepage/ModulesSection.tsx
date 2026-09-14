// ModulesSection.tsx
import React from "react";
import { motion } from "framer-motion";
import ModuleItem from "./ModuleItem";


export interface Lesson {
  title: string;
  description: string;
  lessonType: "text-only" | "text-and-video";
  content: string;
  videoUrl?: string;
  duration?: string;
  order: number;
  completed: boolean;
}

export interface Assessment {
  title: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
  }>;
  completed: boolean;
  score?: number;
}

export interface Module {
  _id: string;
  title: string;
  description: string;
  lessons: {
    _id: string;
    title: string;
    type: 'text' | 'code' | 'video';
    codeExercise?: {
      language: string;
      initialCode: string;
      expectedOutput?: string;
    };
  }[];
  assessment?: {
    questions: {
      text: string;
      options: string[];
      correctAnswer: number;
    }[];
  };
}

interface ModulesSectionProps {
  modules: Module[];
  expandedModules: string[];
  toggleModule: (moduleId: string) => void;
  startLesson: (moduleId: string, lessonIndex: number) => void;
  startAssessment: (moduleId: string) => void;
  onCodeExercise: (exercise: Module['lessons'][0]['codeExercise']) => void;
}

const ModulesSection: React.FC<ModulesSectionProps> = ({
  modules,
  expandedModules,
  toggleModule,
  startLesson,
  startAssessment,
  onCodeExercise,
}) => {
  const handleCodeExerciseClick = (exercise: Module['lessons'][0]['codeExercise']) => {
    if (exercise) {
      onCodeExercise(exercise);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Course Modules</h2>
      <div className="space-y-4">
        {modules.map((module) => (
          <div
            key={module._id}
            className="border rounded-lg overflow-hidden bg-white shadow-sm"
          >
            <button
              onClick={() => toggleModule(module._id)}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-50"
            >
              <div className="flex items-center">
                <i
                  className={`fas fa-chevron-${
                    expandedModules.includes(module._id) ? 'down' : 'right'
                  } mr-2`}
                />
                <h3 className="text-lg font-semibold">{module.title}</h3>
              </div>
              <span className="text-sm text-gray-500">
                {module.lessons.length} lessons
              </span>
            </button>

            {expandedModules.includes(module._id) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t"
              >
                <div className="p-4">
                  <p className="text-gray-600 mb-4">{module.description}</p>
                  <div className="space-y-2">
                    {module.lessons.map((lesson, index) => (
                      <div
                        key={lesson._id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                      >
                        <div className="flex items-center">
                          <i className="fas fa-play-circle text-blue-600 mr-2" />
                          <span>{lesson.title}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {lesson.type === 'code' && lesson.codeExercise && (
                            <button
                              onClick={() => handleCodeExerciseClick(lesson.codeExercise)}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Run Code
                            </button>
                          )}
                          <button
                            onClick={() => startLesson(module._id, index)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Start
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
    </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModulesSection;
