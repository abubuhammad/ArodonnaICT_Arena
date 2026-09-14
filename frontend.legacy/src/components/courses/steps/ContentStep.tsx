// src/components/courses/steps/ContentStep.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  BookOpen, 
  Play, 
  Code, 
  FileText, 
  Trash2, 
  GripVertical,
  Edit3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../ui/button';
import RichTextEditor from '../RichTextEditor';
import type { Module, Lesson } from '../../../types/course';

interface ContentStepProps {
  modules: Module[];
  addNewModule: () => void;
  updateModule: (moduleIndex: number, data: Partial<Module>) => void;
  addLessonToModule: (moduleIndex: number) => void;
  deleteLesson: (moduleIndex: number, lessonIndex: number) => void;
  updateLesson: (moduleIndex: number, lessonIndex: number, data: Partial<Lesson>) => void;
  deleteModule: (moduleIndex: number) => void;
  onLessonTypeChange: (moduleId: string, lessonIndex: number, type: 'text' | 'code' | 'video') => void;
}

const LESSON_TYPES = [
  { 
    value: 'text', 
    label: 'Text Lesson', 
    icon: FileText, 
    color: 'text-blue-600', 
    bg: 'bg-blue-100',
    description: 'Rich text content with formatting'
  },
  { 
    value: 'video', 
    label: 'Video Lesson', 
    icon: Play, 
    color: 'text-red-600', 
    bg: 'bg-red-100',
    description: 'Video content with player'
  },
  { 
    value: 'code', 
    label: 'Code Exercise', 
    icon: Code, 
    color: 'text-green-600', 
    bg: 'bg-green-100',
    description: 'Interactive coding challenge'
  }
];

const ContentStep: React.FC<ContentStepProps> = ({
  modules,
  addNewModule,
  updateModule,
  addLessonToModule,
  deleteLesson,
  updateLesson,
  deleteModule,
  onLessonTypeChange
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const moduleVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95, x: -300 }
  };

  const isModuleComplete = (module: Module) => {
    return module.title && module.description && module.lessons.length > 0 &&
           module.lessons.every(lesson => lesson.title && lesson.content);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Course Content</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Structure your course with modules and lessons. Create engaging content that guides students through their learning journey.
        </p>
      </motion.div>

      {/* Modules */}
      <AnimatePresence mode="popLayout">
        {modules.map((module, moduleIndex) => (
          <motion.div
            key={module._id}
            variants={moduleVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            className={`bg-white rounded-2xl border-2 transition-all duration-300 ${
              isModuleComplete(module) 
                ? 'border-green-200 shadow-lg shadow-green-100' 
                : 'border-gray-200 hover:border-gray-300'
            } overflow-hidden`}
          >
            {/* Module Header */}
            <div className={`p-6 ${
              isModuleComplete(module) 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50' 
                : 'bg-gray-50'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isModuleComplete(module) ? 'bg-green-100' : 'bg-white'
                  }`}>
                    <BookOpen className={`w-5 h-5 ${
                      isModuleComplete(module) ? 'text-green-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Module {moduleIndex + 1}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {isModuleComplete(module) ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm">Complete</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Incomplete</span>
                        </div>
                      )}
                      <span className="text-sm text-gray-500">
                        {module.lessons.length} lessons
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => deleteModule(moduleIndex)}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 px-3 py-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module Title *
                  </label>
                  <input
                    type="text"
                    value={module.title}
                    onChange={(e) => updateModule(moduleIndex, { title: e.target.value })}
                    placeholder="e.g., Introduction to Variables"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module Description *
                  </label>
                  <input
                    type="text"
                    value={module.description}
                    onChange={(e) => updateModule(moduleIndex, { description: e.target.value })}
                    placeholder="Brief description of this module"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Lessons */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-800">Lessons</h4>
                <Button
                  type="button"
                  onClick={() => addLessonToModule(moduleIndex)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-3 py-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Lesson
                </Button>
              </div>

              <AnimatePresence>
                {module.lessons.map((lesson, lessonIndex) => (
                  <motion.div
                    key={lessonIndex}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 last:mb-0"
                  >
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                          <span className="text-sm font-medium text-gray-600">
                            Lesson {lessonIndex + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Lesson Type Selector */}
                          <div className="flex gap-1">
                            {LESSON_TYPES.map((type) => {
                              const Icon = type.icon;
                              const isSelected = lesson.lessonType === type.value || 
                                               (lesson.lessonType === 'text-only' && type.value === 'text');
                              return (
                                <button
                                  key={type.value}
                                  type="button"
                                  onClick={() => onLessonTypeChange(module._id, lessonIndex, type.value as 'text' | 'code' | 'video')}
                                  className={`p-2 rounded-lg transition-all duration-300 ${
                                    isSelected 
                                      ? `${type.bg} ${type.color}` 
                                      : 'bg-white text-gray-400 hover:text-gray-600'
                                  }`}
                                  title={type.description}
                                >
                                  <Icon className="w-4 h-4" />
                                </button>
                              );
                            })}
                          </div>
                          <Button
                            type="button"
                            onClick={() => deleteLesson(moduleIndex, lessonIndex)}
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 p-2"
                            aria-label={`Delete lesson ${lessonIndex + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Lesson Title *
                            </label>
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) => updateLesson(moduleIndex, lessonIndex, { title: e.target.value })}
                              placeholder="e.g., What are Variables?"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Lesson Description *
                            </label>
                            <input
                              type="text"
                              value={lesson.description}
                              onChange={(e) => updateLesson(moduleIndex, lessonIndex, { description: e.target.value })}
                              placeholder="Brief description of this lesson"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-300"
                            />
                          </div>
                        </div>

                        {/* Lesson Content */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content *
                          </label>
                          {lesson.lessonType === 'video' ? (
                            <input
                              type="url"
                              value={lesson.videoUrl || ''}
                              onChange={(e) => updateLesson(moduleIndex, lessonIndex, { 
                                videoUrl: e.target.value,
                                content: e.target.value 
                              })}
                              placeholder="https://youtube.com/watch?v=..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-300"
                            />
                          ) : (
                            <RichTextEditor
                              content={lesson.content || ''}
                              onChange={(content) => updateLesson(moduleIndex, lessonIndex, { content })}
                              placeholder={`Write your ${lesson.lessonType === 'code' ? 'coding exercise' : 'lesson'} content here...`}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {module.lessons.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No lessons yet. Add your first lesson to get started!</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add Module Button */}
      <motion.div variants={itemVariants} className="text-center">
        <Button
          type="button"
          onClick={addNewModule}
          className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 px-8 py-4 text-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Module
        </Button>
      </motion.div>

      {modules.length === 0 && (
        <motion.div 
          variants={itemVariants}
          className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Create Your First Module</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Modules help organize your course content. Start by creating your first module and adding lessons to it.
          </p>
          <Button
            type="button"
            onClick={addNewModule}
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 px-6 py-3"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create First Module
          </Button>
        </motion.div>
      )}

      {/* Progress Summary */}
      {modules.length > 0 && (
        <motion.div 
          variants={itemVariants}
          className="mt-8 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-800">
                Content Structure: {modules.filter(isModuleComplete).length}/{modules.length} modules complete
              </span>
            </div>
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Step 2 of 5
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ContentStep;
