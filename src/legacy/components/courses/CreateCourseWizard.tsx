// src/components/courses/CreateCourseWizard.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  Image, 
  Play, 
  FileText, 
  CheckCircle2,
  Sparkles,
  Target,
  Users
} from 'lucide-react';
import { Button } from '../ui/button';

interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'basic-info',
    title: 'Course Basics',
    subtitle: 'Set up your course foundation',
    icon: BookOpen,
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-purple-600'
  },
  {
    id: 'content',
    title: 'Course Content',
    subtitle: 'Add modules and lessons',
    icon: FileText,
    color: 'text-green-600',
    gradient: 'from-green-500 to-teal-600'
  },
  {
    id: 'media',
    title: 'Media & Assets',
    subtitle: 'Upload images and videos',
    icon: Image,
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-pink-600'
  },
  {
    id: 'assessment',
    title: 'Assessment',
    subtitle: 'Create quizzes and tests',
    icon: Target,
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-red-600'
  },
  {
    id: 'publish',
    title: 'Publish',
    subtitle: 'Review and launch',
    icon: Sparkles,
    color: 'text-pink-600',
    gradient: 'from-pink-500 to-rose-600'
  }
];

interface CreateCourseWizardProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isStepValid: (step: number) => boolean;
  children: React.ReactNode;
}

const CreateCourseWizard: React.FC<CreateCourseWizardProps> = ({
  currentStep,
  setCurrentStep,
  isStepValid,
  children
}) => {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Mark previous steps as completed if they're valid
    const newCompletedSteps = new Set(completedSteps);
    for (let i = 0; i < currentStep; i++) {
      if (isStepValid(i)) {
        newCompletedSteps.add(i);
      }
    }
    setCompletedSteps(newCompletedSteps);
  }, [currentStep, isStepValid]);

  const canProceed = () => {
    return isStepValid(currentStep);
  };

  const nextStep = () => {
    if (canProceed() && currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    // Only allow going to a step if all previous steps are completed or we're going backwards
    if (stepIndex <= currentStep || stepIndex === 0) {
      setCurrentStep(stepIndex);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Header with Progress */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-4">
            Create Your Course
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your knowledge into an engaging learning experience with our intuitive course builder
          </p>
        </motion.div>

        {/* Step Indicator */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-center space-x-4 overflow-x-auto pb-4">
            {WIZARD_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(index);
              const isAccessible = index <= currentStep;

              return (
                <motion.div
                  key={step.id}
                  className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${
                    isAccessible ? 'opacity-100' : 'opacity-40'
                  }`}
                  onClick={() => goToStep(index)}
                  whileHover={isAccessible ? { scale: 1.05 } : {}}
                  whileTap={isAccessible ? { scale: 0.95 } : {}}
                >
                  <div className="relative">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        isActive
                          ? `bg-gradient-to-r ${step.gradient} shadow-lg shadow-${step.color.split('-')[1]}-500/50`
                          : isCompleted
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/30'
                          : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-8 h-8 text-white" />
                      ) : (
                        <StepIcon 
                          className={`w-8 h-8 transition-colors duration-300 ${
                            isActive ? 'text-white' : step.color
                          }`} 
                        />
                      )}
                    </div>
                    
                    {isActive && (
                      <motion.div
                        className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-20"
                        layoutId="activeStepGlow"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </div>
                  
                  <div className="mt-3 text-center min-w-0">
                    <h3 className={`text-sm font-semibold transition-colors duration-300 ${
                      isActive ? step.color : 'text-gray-700'
                    }`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 truncate max-w-24">
                      {step.subtitle}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Step {currentStep + 1} of {WIZARD_STEPS.length}</span>
              <span>{Math.round(((currentStep + 1) / WIZARD_STEPS.length) * 100)}% Complete</span>
            </div>
          </div>
        </motion.div>

        {/* Step Content */}
        <motion.div
          className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 md:p-12 mb-8"
          layout
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div 
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            variant="outline"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>Join 10,000+ instructors</span>
          </div>

          {currentStep < WIZARD_STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                canProceed()
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl transition-all duration-300 ${
                canProceed()
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Publish Course
            </Button>
          )}
        </motion.div>
      </div>

      <style>{`
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default CreateCourseWizard;
