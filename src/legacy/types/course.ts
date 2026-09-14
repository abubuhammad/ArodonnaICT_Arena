// src/types/course.ts

export interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  instructor: {
    _id: string;
    name: string;
    title?: string;
    avatar?: string;
    isAvailableForCall?: boolean;
  };
  level: string;
  duration: string;
  thumbnail?: string;
  category: string;
  finalAssessment?: Assessment | null; // Optional final assessment using the Assessment type
}

export interface CodeExercise {
  language: 'python' | 'javascript' | 'typescript' | 'html' | 'css';
  initialCode: string;
  expectedOutput?: string;
}

export interface Quiz {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
}

export interface Assignment {
  title: string;
  description: string;
  dueDate?: Date;
  totalPoints: number;
  instructions: string;
  submissionType: 'file' | 'text' | 'link';
  resources?: {
    title: string;
    url: string;
  }[];
}

export interface Lesson {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  content: string;
  type: 'text' | 'code' | 'video';
  lessonType: 'text-only' | 'video' | 'quiz' | 'code' | 'text-and-video';
  videoUrl?: string;
  order: number;
  completed?: boolean;
  quizQuestion?: string;
  quizOptions?: string[];
  correctAnswer?: string;
  codeExercise?: CodeExercise;
  quiz?: Quiz;
  assignment?: Assignment;
  duration?: string;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
  completed?: boolean;
  instructions?: string;
  attempts?: number;
  maxAttempts?: number;
}

export interface Module {
  _id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
  assessment?: Assessment;
  courseId?: string;
  duration?: string;
  learningObjectives?: string[];
}

export interface CreateCourseData extends Omit<Course, '_id' | 'instructor' | 'enrolledStudents'> {}
