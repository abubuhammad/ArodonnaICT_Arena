import React from "react";
import { motion } from "framer-motion";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import ModuleItem from "./ModuleItem";
import RichTextEditor from "./RichTextEditor";
import type { Module, Lesson, Assessment, CodeExercise } from "../../types/course";

interface ModulesSectionProps {
  modules: Module[];
  addNewModule: () => void;
  updateModule: (moduleIndex: number, data: Partial<Module>) => void;
  addLessonToModule: (moduleIndex: number) => void;
  updateLesson: (moduleIndex: number, lessonIndex: number, data: Partial<Lesson>) => void;
  addAssessmentToModule: (moduleIndex: number) => void;
  deleteModule: (moduleIndex: number) => void;
  onLessonTypeChange?: (moduleId: string, lessonIndex: number, type: 'text' | 'code' | 'video') => void;
  onCodeExerciseChange?: (moduleId: string, lessonIndex: number, field: keyof CodeExercise, value: string) => void;
  children?: React.ReactNode;
}

const ModulesSection: React.FC<ModulesSectionProps> = ({
  modules,
  addNewModule,
  updateModule,
  addLessonToModule,
  updateLesson,
  addAssessmentToModule,
  deleteModule,
  onLessonTypeChange,
  onCodeExerciseChange,
  children
}) => {
  return (
    <motion.div
      className="bg-white p-6 rounded-lg shadow-md mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Course Modules</h2>
        <button
          type="button"
          onClick={addNewModule}
          className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span>Add Module</span>
        </button>
      </div>
      <div className="space-y-6">
        {children || (
          <div className="space-y-4">
        {modules.map((module, moduleIndex) => (
              <div key={module._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={module.title}
                      onChange={(e) =>
                        updateModule(moduleIndex, { title: e.target.value })
                      }
                      className="block w-full text-lg font-medium text-gray-900 border-0 border-b border-gray-300 focus:border-purple-500 focus:ring-0 sm:text-lg"
                      placeholder="Module Title"
                    />
                    <textarea
                      value={module.description}
                      onChange={(e) =>
                        updateModule(moduleIndex, { description: e.target.value })
                      }
                      className="mt-1 block w-full text-sm text-gray-500 border-0 border-b border-gray-300 focus:border-purple-500 focus:ring-0"
                      placeholder="Module Description"
                      rows={2}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteModule(moduleIndex)}
                    className="ml-4 text-red-600 hover:text-red-800"
                  >
                    Delete Module
                  </button>
                </div>

                <div className="space-y-4 mt-4">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson._id || lesson.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) =>
                              updateLesson(moduleIndex, lessonIndex, {
                                title: e.target.value,
                              })
                            }
                            className="block w-full text-base font-medium text-gray-900 border-0 border-b border-gray-300 focus:border-purple-500 focus:ring-0"
                            placeholder="Lesson Title"
                          />
                        </div>
                        <div className="flex space-x-2">
                          {onLessonTypeChange && (
                            <select
                              value={lesson.type}
                              onChange={(e) => onLessonTypeChange(module._id, lessonIndex, e.target.value as 'text' | 'code' | 'video')}
                              className="border rounded px-2 py-1"
                            >
                              <option value="text">Text</option>
                              <option value="code">Code</option>
                              <option value="video">Video</option>
                            </select>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const newLessons = module.lessons.filter(
                                (_, i) => i !== lessonIndex
                              );
                              updateModule(moduleIndex, { lessons: newLessons });
                            }}
                            className="ml-4 text-red-600 hover:text-red-800"
                          >
                            Delete Lesson
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Lesson Description
                          </label>
                          <textarea
                            value={lesson.description}
                            onChange={(e) =>
                              updateLesson(moduleIndex, lessonIndex, {
                                description: e.target.value,
                              })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                            rows={3}
                          />
                        </div>

                        {lesson.type === 'text' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Lesson Content
                            </label>
                            <RichTextEditor
                              content={lesson.content}
                              onChange={(content) =>
                                updateLesson(moduleIndex, lessonIndex, { content })
                              }
                              placeholder="Start writing your lesson content..."
                            />
                          </div>
                        )}

                        {lesson.type === 'code' && lesson.codeExercise && onCodeExerciseChange && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Language</label>
                              <select
                                value={lesson.codeExercise.language}
                                onChange={(e) => onCodeExerciseChange(module._id, lessonIndex, 'language', e.target.value as CodeExercise['language'])}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                              >
                                <option value="python">Python</option>
                                <option value="javascript">JavaScript</option>
                                <option value="typescript">TypeScript</option>
                                <option value="html">HTML</option>
                                <option value="css">CSS</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Initial Code</label>
                              <textarea
                                value={lesson.codeExercise.initialCode}
                                onChange={(e) => onCodeExerciseChange(module._id, lessonIndex, 'initialCode', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 font-mono"
                                rows={5}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Expected Output (Optional)</label>
                              <textarea
                                value={lesson.codeExercise.expectedOutput || ''}
                                onChange={(e) => onCodeExerciseChange(module._id, lessonIndex, 'expectedOutput', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 font-mono"
                                rows={3}
                              />
                            </div>
                          </div>
                        )}

                        {lesson.type === 'video' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Video URL
                            </label>
                            <input
                              type="text"
                              value={lesson.videoUrl || ""}
                              onChange={(e) =>
                                updateLesson(moduleIndex, lessonIndex, {
                                  videoUrl: e.target.value,
                                })
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                              placeholder="https://..."
                            />
                          </div>
                        )}

                        {/* Quiz Section */}
                        <div className="border-t pt-4">
                          <h4 className="text-lg font-medium text-gray-900 mb-4">Quiz</h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Quiz Question
                              </label>
                              <input
                                type="text"
                                value={lesson.quizQuestion || ""}
                                onChange={(e) =>
                                  updateLesson(moduleIndex, lessonIndex, {
                                    quizQuestion: e.target.value,
                                  })
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Quiz Options
                              </label>
                              {(lesson.quizOptions || []).map((option, optionIndex) => (
                                <div key={optionIndex} className="flex gap-2 mt-2">
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...(lesson.quizOptions || [])];
                                      newOptions[optionIndex] = e.target.value;
                                      updateLesson(moduleIndex, lessonIndex, {
                                        quizOptions: newOptions,
                                      });
                                    }}
                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                                    placeholder={`Option ${optionIndex + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOptions = (lesson.quizOptions || []).filter(
                                        (_, i) => i !== optionIndex
                                      );
                                      updateLesson(moduleIndex, lessonIndex, {
                                        quizOptions: newOptions,
                                      });
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = [
                                    ...(lesson.quizOptions || []),
                                    "",
                                  ];
                                  updateLesson(moduleIndex, lessonIndex, {
                                    quizOptions: newOptions,
                                  });
                                }}
                                className="mt-2 text-sm text-purple-600 hover:text-purple-800"
                              >
                                Add Option
                              </button>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Correct Answer
                              </label>
                              <select
                                value={lesson.correctAnswer || ""}
                                onChange={(e) =>
                                  updateLesson(moduleIndex, lessonIndex, {
                                    correctAnswer: e.target.value,
                                  })
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                              >
                                <option value="">Select correct answer</option>
                                {(lesson.quizOptions || []).map((option, index) => (
                                  <option key={index} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addLessonToModule(moduleIndex)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Add Lesson
                  </button>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => addAssessmentToModule(moduleIndex)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Add Assessment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ModulesSection;
