// src/components/courses/steps/BasicInfoStep.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  DollarSign, 
  Tag, 
  FileText, 
  Sparkles,
  TrendingUp 
} from 'lucide-react';
import { Button } from '../../ui/button';
import { CreateCourseData } from '../CourseBasicInfo';

interface BasicInfoStepProps {
  courseData: CreateCourseData;
  handleCourseDataChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFreeCourseChange: (checked: boolean) => void;
  categories?: { id: string; name: string }[]; // optional list from backend
}

const DEFAULT_CATEGORIES = [
  { value: 'Programming', icon: '💻', color: 'from-blue-500 to-cyan-500' },
  { value: 'Design', icon: '🎨', color: 'from-purple-500 to-pink-500' },
  { value: 'Business', icon: '💼', color: 'from-green-500 to-teal-500' },
  { value: 'Marketing', icon: '📈', color: 'from-orange-500 to-red-500' },
  { value: 'Photography', icon: '📸', color: 'from-yellow-500 to-orange-500' },
  { value: 'Music', icon: '🎵', color: 'from-indigo-500 to-purple-500' },
];

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  courseData,
  handleCourseDataChange,
  onFreeCourseChange,
  categories
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
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
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Course Basics</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Let's start with the fundamentals. Give your course a compelling title and description that will attract students.
        </p>
      </motion.div>

      {/* Course Title */}
      <motion.div variants={itemVariants} className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          Course Title *
        </label>
        <div className="relative">
          <input
            type="text"
            name="title"
            value={courseData.title}
            onChange={handleCourseDataChange}
            placeholder="e.g., Complete Python Bootcamp: From Zero to Hero"
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 text-lg font-medium placeholder-gray-400"
            maxLength={100}
          />
          <div className="absolute top-4 right-4 text-sm text-gray-400">
            {courseData.title.length}/100
          </div>
        </div>
      </motion.div>

      {/* Course Description */}
      <motion.div variants={itemVariants} className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FileText className="w-4 h-4 text-blue-500" />
          Course Description *
        </label>
        <div className="relative">
          <textarea
            name="description"
            value={courseData.description}
            onChange={handleCourseDataChange}
            placeholder="Describe what students will learn, the outcomes they can expect, and why they should take this course..."
            rows={6}
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 resize-none placeholder-gray-400"
            maxLength={1000}
          />
          <div className="absolute bottom-4 right-4 text-sm text-gray-400">
            {courseData.description.length}/1000
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Selection */}
        <motion.div variants={itemVariants} className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Tag className="w-4 h-4 text-purple-500" />
            Category *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(categories && categories.length > 0
              ? categories.map((c) => ({ value: c.id, label: c.name, icon: '🏷️', color: 'from-indigo-500 to-violet-500' }))
              : DEFAULT_CATEGORIES
            ).map((category) => (
              <label key={category.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={category.value}
                  checked={courseData.category === category.value}
                  onChange={handleCourseDataChange}
                  className="sr-only"
                />
                <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  courseData.category === category.value
                    ? `border-transparent bg-gradient-to-r ${category.color} text-white shadow-lg`
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <div className="text-center">
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <div className="text-sm font-medium">{'label' in category ? (category as any).label : category.value}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div variants={itemVariants} className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <DollarSign className="w-4 h-4 text-green-500" />
            Pricing
          </label>
          
          {/* Free Course Toggle */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={courseData.isFree}
                onChange={(e) => onFreeCourseChange(e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div>
                <div className="font-medium text-green-800">Free Course</div>
                <div className="text-sm text-green-600">Make this course available to everyone</div>
              </div>
            </label>
          </div>

          {/* Price Input */}
          {!courseData.isFree && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-gray-700">Course Price ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  name="price"
                  value={courseData.price}
                  onChange={handleCourseDataChange}
                  placeholder="49.99"
                  className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-all duration-300"
                  min="0"
                  step="0.01"
                />
              </div>
            </motion.div>
          )}

          {/* Pricing Tips */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">Pricing Tips</div>
                <ul className="text-xs space-y-1">
                  <li>• Research similar courses in your category</li>
                  <li>• Consider offering early-bird discounts</li>
                  <li>• Start with competitive pricing to build reviews</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Duration */}
      <motion.div variants={itemVariants} className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          Duration
        </label>
        <input
          type="text"
          name="duration"
          value={courseData.duration || ""}
          onChange={handleCourseDataChange}
          placeholder="e.g., 6 hours, 4 weeks, 12 lessons"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300"
        />
      </motion.div>

      {/* Progress Indicator */}
      <motion.div 
        variants={itemVariants}
        className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-800">Course Foundation</span>
          </div>
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            Step 1 of 5
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BasicInfoStep;
