import api from '../utils/api';

export interface LessonProgress {
  lessonId: string;
  title?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'LOCKED';
  attempts: number;
  bestScore?: number;
  lastViewedAt?: string;
  completedAt?: string;
}

export interface ModuleProgress {
  moduleId: string;
  title?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED' | 'LOCKED';
  bestScore?: number;
  assessmentPassed?: boolean;
  lessons: LessonProgress[];
}

export interface EnrollmentProgress {
  enrollmentId: string;
  status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';
  progressPercentage: number;
  modules: ModuleProgress[];
}

/**
 * Fetch enrollment progress from the API.
 * Used to drive UI state for lesson locks, tick marks, and gating logic.
 */
export async function getEnrollmentProgress(enrollmentId: string): Promise<EnrollmentProgress> {
  try {
    const response = await api.get(`/enrollments/${enrollmentId}/progress`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch enrollment progress:', error);
    throw error;
  }
}

/**
 * Helper: Check if a lesson is locked (status === LOCKED).
 */
export function isLessonLocked(lesson: LessonProgress): boolean {
  return lesson.status === 'LOCKED';
}

/**
 * Helper: Check if a lesson is passed and can be navigated past.
 */
export function isLessonPassed(lesson: LessonProgress): boolean {
  return lesson.status === 'PASSED';
}

/**
 * Helper: Get remaining attempts for a lesson quiz.
 */
export function getAttemptsRemaining(lesson: LessonProgress, maxAttempts: number = 3): number {
  return Math.max(0, maxAttempts - lesson.attempts);
}

/**
 * Helper: Check if all lessons in a module are passed.
 */
export function areAllLessonsPassed(module: ModuleProgress): boolean {
  return module.lessons.every(l => isLessonPassed(l));
}

// --- Quiz / assessment taking -------------------------------------------------
// All grading happens on the server. These calls only ever send the learner's
// selected answers — never a score or pass/fail flag — and the server returns
// the graded result.

export interface SanitizedQuestion {
  text: string;
  options?: string[];
  type?: string;
}

export interface SanitizedQuiz {
  id?: string;
  title: string;
  passingScore: number;
  attemptsAllowed?: number;
  questions: SanitizedQuestion[];
  unlocked?: boolean;
}

export interface GradedResult {
  score: number;
  passed?: boolean;
  passingScore?: number;
  status?: string;
  attemptId?: string;
  attemptsRemaining?: number;
  certificate?: { id: string; fileUrl?: string; issuedAt?: string } | null;
}

export async function getLessonQuiz(enrollmentId: string, lessonId: string): Promise<SanitizedQuiz> {
  const response = await api.get(`/enrollments/${enrollmentId}/lessons/${lessonId}/quiz`);
  return response.data;
}

export async function submitLessonQuiz(enrollmentId: string, quizId: string, answers: any[]): Promise<GradedResult> {
  const response = await api.post(`/enrollments/${enrollmentId}/quizzes/${quizId}/submit`, { answers });
  return response.data.result;
}

export async function getModuleAssessment(enrollmentId: string, moduleId: string): Promise<SanitizedQuiz> {
  const response = await api.get(`/enrollments/${enrollmentId}/modules/${moduleId}/assessment`);
  return response.data;
}

export async function submitModuleAssessment(enrollmentId: string, moduleId: string, answers: any[]): Promise<GradedResult> {
  const response = await api.post(`/enrollments/${enrollmentId}/modules/${moduleId}/assessment/submit`, { answers });
  return response.data.result;
}

export async function getFinalAssessment(enrollmentId: string): Promise<SanitizedQuiz> {
  const response = await api.get(`/enrollments/${enrollmentId}/final-assessment`);
  return response.data;
}

export async function submitFinalAssessment(enrollmentId: string, answers: any[]): Promise<GradedResult> {
  const response = await api.post(`/enrollments/${enrollmentId}/final-assessment/submit`, { answers });
  return response.data.result;
}
