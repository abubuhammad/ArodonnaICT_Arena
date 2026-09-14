import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

export enum LessonStatus { NOT_STARTED = 'NOT_STARTED', IN_PROGRESS = 'IN_PROGRESS', PASSED = 'PASSED', FAILED = 'FAILED', LOCKED = 'LOCKED' }
export enum ModuleStatus { NOT_STARTED = 'NOT_STARTED', IN_PROGRESS = 'IN_PROGRESS', PASSED = 'PASSED', LOCKED = 'LOCKED' }

type ProgressLesson = { lesson: string; status: LessonStatus; attempts: number; bestScore?: number; completedAt?: Date; lastViewedAt?: Date };
type ProgressModule = { module: string; status: ModuleStatus; lessonProgress: ProgressLesson[]; bestScore?: number; assessmentPassed?: boolean; completedAt?: Date };

const progressModules = (value: unknown): ProgressModule[] => Array.isArray(value) ? value as ProgressModule[] : [];

const normalizeProgress = (courseModules: any[], existingModules: unknown, completed: boolean): ProgressModule[] => {
  const storedModules = progressModules(existingModules);
  return courseModules.map((courseModule, moduleIndex) => {
    const storedModule: any = storedModules.find((item: any) => String(item.module ?? item.moduleId) === String(courseModule.id));
    const storedLessons = Array.isArray(storedModule?.lessonProgress) ? storedModule.lessonProgress : Array.isArray(storedModule?.lessons) ? storedModule.lessons : [];
    return {
      module: courseModule.id,
      status: completed ? ModuleStatus.PASSED : storedModule?.status || (moduleIndex === 0 ? ModuleStatus.NOT_STARTED : ModuleStatus.LOCKED),
      assessmentPassed: completed ? true : storedModule?.assessmentPassed,
      bestScore: storedModule?.bestScore,
      completedAt: storedModule?.completedAt,
      lessonProgress: (courseModule.lessons || []).map((lesson: any, lessonIndex: number) => {
        const storedLesson: any = storedLessons.find((item: any) => String(item.lesson ?? item.lessonId) === String(lesson.id));
        return {
          lesson: lesson.id,
          status: completed ? LessonStatus.PASSED : storedLesson?.status || (moduleIndex === 0 && lessonIndex === 0 ? LessonStatus.NOT_STARTED : LessonStatus.LOCKED),
          attempts: storedLesson?.attempts || 0,
          bestScore: storedLesson?.bestScore,
          completedAt: storedLesson?.completedAt,
          lastViewedAt: storedLesson?.lastViewedAt,
        };
      }),
    };
  });
};

export async function ensureProgress(enrollmentId: string, userId: string) {
  const enrollment = await prisma.enrollment.findFirst({ where: { id: enrollmentId, userId }, include: { course: { include: { modules: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' } } } } } } } });
  if (!enrollment) throw new Error('Enrollment not found or not owned');
  let existing = await prisma.courseProgress.findUnique({ where: { enrollmentId } });
  const completed = enrollment.progressPercentage >= 100 || enrollment.status === 'COMPLETED';
  if (!existing) {
    const modules = normalizeProgress(enrollment.course.modules, [], completed);
    existing = await prisma.courseProgress.create({ data: { enrollmentId, progress: { modules }, modules, overallScore: 0 } });
  }
  const modules = normalizeProgress(enrollment.course.modules, existing.modules || (existing.progress as any)?.modules, completed);
  return { enrollment, existing, modules };
}

async function saveProgress(enrollmentId: string, modules: ProgressModule[]) {
  const jsonModules = JSON.parse(JSON.stringify(modules));
  return prisma.courseProgress.update({ where: { enrollmentId }, data: { modules: jsonModules, progress: { modules: jsonModules } } });
}

async function syncEnrollment(enrollmentId: string, modules: ProgressModule[]) {
  const completed = modules.filter((module) => module.status === ModuleStatus.PASSED).length;
  const percentage = modules.length ? (completed / modules.length) * 100 : 0;
  await prisma.enrollment.update({ where: { id: enrollmentId }, data: { progressPercentage: percentage, status: percentage >= 100 ? 'COMPLETED' : percentage > 0 ? 'IN_PROGRESS' : undefined } });
}

export async function startCourse(enrollmentId: string, userId: string) {
  const state = await ensureProgress(enrollmentId, userId);
  if (state.enrollment.status !== 'IN_PROGRESS') await prisma.enrollment.update({ where: { id: enrollmentId }, data: { status: 'IN_PROGRESS', startedAt: new Date() } });
}

export async function viewLesson(enrollmentId: string, userId: string, lessonId: string) {
  const state = await ensureProgress(enrollmentId, userId);
  for (const module of state.modules) {
    const lesson = module.lessonProgress.find((item) => item.lesson === lessonId);
    if (!lesson) continue;
    if (lesson.status === LessonStatus.LOCKED) throw new Error('Lesson is locked');
    if (lesson.status === LessonStatus.NOT_STARTED) lesson.status = LessonStatus.IN_PROGRESS;
    lesson.lastViewedAt = new Date();
    await saveProgress(enrollmentId, state.modules);
    return lesson;
  }
  throw new Error('Lesson progress not found for this enrollment');
}

export async function completeLessonNoQuiz(enrollmentId: string, userId: string, lessonId: string) {
  const lessonRecord = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lessonRecord) throw new Error('Lesson not found');
  if (lessonRecord.hasQuiz) throw new Error('This lesson has a quiz and must be completed via quiz submission, not marked complete directly');
  const state = await ensureProgress(enrollmentId, userId);
  for (let moduleIndex = 0; moduleIndex < state.modules.length; moduleIndex++) {
    const module = state.modules[moduleIndex];
    const lessonIndex = module.lessonProgress.findIndex((item) => item.lesson === lessonId);
    if (lessonIndex < 0) continue;
    const lesson = module.lessonProgress[lessonIndex];
    if (lesson.status === LessonStatus.LOCKED) throw new Error('Lesson is locked');
    lesson.status = LessonStatus.PASSED;
    lesson.completedAt = new Date();
    if (module.lessonProgress[lessonIndex + 1]?.status === LessonStatus.LOCKED) module.lessonProgress[lessonIndex + 1].status = LessonStatus.NOT_STARTED;
    await maybeCompleteModuleAndUnlock(state.modules, moduleIndex);
    await saveProgress(enrollmentId, state.modules);
    await syncEnrollment(enrollmentId, state.modules);
    return lesson;
  }
  throw new Error('Lesson not part of enrollment progress');
}

function gradeQuestions(questions: any[], answers: any[]): { score: number; correctCount: number; total: number } {
  const list = Array.isArray(questions) ? questions : [];
  if (!list.length) return { score: 0, correctCount: 0, total: 0 };
  const correctCount = list.filter((question, index) => {
    const submitted = answers?.[index];
    const key = question?.correctAnswer ?? question?.correct ?? question?.answer;
    return submitted !== undefined && submitted !== null && String(submitted) === String(key);
  }).length;
  return { score: Math.round((correctCount / list.length) * 100), correctCount, total: list.length };
}

export function sanitizeQuestions(questions: any[]): any[] {
  return (Array.isArray(questions) ? questions : []).map(({ correctAnswer, correct, answer, ...rest }) => rest);
}

export async function submitQuiz(enrollmentId: string, userId: string, quizId: string, answers: any) {
  return prisma.$transaction(async (tx) => {
    const quiz = await tx.quiz.findUnique({ where: { id: quizId } });
    const enrollment = await tx.enrollment.findFirst({ where: { id: enrollmentId, userId } });
    if (!quiz) throw new Error('Quiz not found');
    if (!enrollment) throw new Error('Invalid enrollment');
    const attemptNo = (await tx.quizAttempt.count({ where: { quizId, userId } })) + 1;
    const questions = Array.isArray(quiz.legacyQuestions) ? quiz.legacyQuestions : [];
    const config: any = quiz.config || {};
    const attemptsAllowed = Number(config.attemptsAllowed || quiz.attemptsAllowed || 3);
    if (attemptNo > attemptsAllowed) throw new Error('No attempts remaining for this quiz');
    const score = config.grading === 'auto' || quiz.gradingMode === 'auto' ? gradeQuestions(questions, answers || []).score : undefined;
    const attempt = await tx.quizAttempt.create({ data: { quizId, userId, enrollmentId, answers, attemptNo, score, status: score === undefined ? 'AWAITING_MANUAL_REVIEW' : 'GRADED', gradedAt: score === undefined ? undefined : new Date() } });
    if (score === undefined) return { attemptId: attempt.id, status: attempt.status };
    const state = await ensureProgress(enrollmentId, userId);
    for (const module of state.modules) {
      const lesson = module.lessonProgress.find((item) => item.lesson === quiz.lessonId);
      if (!lesson) continue;
      lesson.attempts = (lesson.attempts || 0) + 1;
      lesson.bestScore = Math.max(lesson.bestScore || 0, score);
      lesson.status = score >= Number(config.passingScore || quiz.passingScore || 70) ? LessonStatus.PASSED : lesson.attempts >= attemptsAllowed ? LessonStatus.FAILED : LessonStatus.IN_PROGRESS;
      if (lesson.status === LessonStatus.PASSED) await maybeCompleteModuleAndUnlock(state.modules, state.modules.indexOf(module));
      await tx.courseProgress.update({ where: { enrollmentId }, data: { modules: state.modules, progress: { modules: state.modules } } });
      await tx.enrollment.update({ where: { id: enrollmentId }, data: { progressPercentage: state.modules.filter((item) => item.status === ModuleStatus.PASSED).length / Math.max(state.modules.length, 1) * 100 } });
      return { attemptId: attempt.id, score, status: lesson.status, attemptsRemaining: Math.max(0, attemptsAllowed - lesson.attempts) };
    }
    throw new Error('LessonProgress not found');
  });
}

async function completeModuleAssessment(enrollmentId: string, userId: string, moduleId: string, assessmentPassed: boolean, score?: number) {
  const state = await ensureProgress(enrollmentId, userId);
  const index = state.modules.findIndex((module) => module.module === moduleId);
  if (index < 0) throw new Error('Module progress not found');
  const module = state.modules[index];
  if (!module.lessonProgress.every((lesson) => lesson.status === LessonStatus.PASSED)) throw new Error('All lessons must be passed before completing module assessment');
  module.assessmentPassed = assessmentPassed;
  if (typeof score === 'number') module.bestScore = Math.max(module.bestScore || 0, score);
  module.status = assessmentPassed ? ModuleStatus.PASSED : ModuleStatus.IN_PROGRESS;
  if (assessmentPassed) module.completedAt = new Date();
  await maybeCompleteModuleAndUnlock(state.modules, index);
  await saveProgress(enrollmentId, state.modules);
  await syncEnrollment(enrollmentId, state.modules);
  return { passed: assessmentPassed, status: module.status, assessmentPassed, score, finalAssessmentUnlocked: state.modules.every((item) => item.status === ModuleStatus.PASSED) };
}

export async function submitModuleAssessment(enrollmentId: string, userId: string, moduleId: string, answers: any[]) {
  const enrollment = await prisma.enrollment.findFirst({ where: { id: enrollmentId, userId }, include: { course: { include: { modules: true } } } });
  if (!enrollment) throw new Error('Invalid enrollment');
  const courseModule = enrollment.course.modules.find((m) => m.id === moduleId);
  if (!courseModule) throw new Error('Module not found for this course');
  const assessment: any = courseModule.assessment || {};
  const questions = Array.isArray(assessment.questions) ? assessment.questions : [];
  if (!questions.length) throw new Error('This module has no assessment configured');
  const score = gradeQuestions(questions, answers || []).score;
  const passingScore = Number(assessment.passingScore || 70);
  const result = await completeModuleAssessment(enrollmentId, userId, moduleId, score >= passingScore, score);
  return { ...result, score, passingScore };
}

export async function submitFinalAssessment(enrollmentId: string, userId: string, answers: any[]) {
  const enrollment = await prisma.enrollment.findFirst({ where: { id: enrollmentId, userId }, include: { course: { include: { instructor: true } } } });
  if (!enrollment) throw new Error('Invalid enrollment');
  const state = await ensureProgress(enrollmentId, userId);
  if (!state.modules.every((module) => module.status === ModuleStatus.PASSED)) throw new Error('All modules must be passed before attempting the final assessment');
  const finalAssessment: any = enrollment.course.finalAssessment || {};
  const questions = Array.isArray(finalAssessment.questions) ? finalAssessment.questions : [];
  if (!questions.length) throw new Error('This course has no final assessment configured');
  const score = gradeQuestions(questions, answers || []).score;
  const passingScore = Number(finalAssessment.passingScore || 70);
  const passed = score >= passingScore;
  return prisma.$transaction(async (tx) => {
    const updated = await tx.enrollment.update({ where: { id: enrollmentId }, data: { finalAssessmentPassed: passed, finalScore: score, status: passed ? 'COMPLETED' : enrollment.status } });
    let certificate = null;
    if (passed) {
      const existing = await tx.certificate.findFirst({ where: { enrollmentId } });
      if (existing) certificate = existing;
      else {
        const id = randomUUID();
        const fileUrl = `${process.env.CERTIFICATE_BASE_URL || 'http://localhost:5000/api/certificates'}/${id}/download`;
        certificate = await tx.certificate.create({ data: { id, enrollmentId, serial: id, fileUrl, issuedAt: new Date(), metadata: { template: enrollment.course.instructor.certificateTemplate || null } } });
        await tx.enrollment.update({ where: { id: enrollmentId }, data: { certificate: { id, issuedAt: certificate.issuedAt, downloadUrl: fileUrl } } });
      }
    }
    return { passed, score, passingScore, status: updated.status, certificate };
  });
}

async function maybeCompleteModuleAndUnlock(modules: ProgressModule[], index: number) {
  const module = modules[index];
  if (!module.lessonProgress.every((lesson) => lesson.status === LessonStatus.PASSED) || module.assessmentPassed === false) return;
  module.status = ModuleStatus.PASSED;
  module.completedAt = module.completedAt || new Date();
  const next = modules[index + 1];
  if (next) { next.status = ModuleStatus.NOT_STARTED; if (next.lessonProgress[0]?.status === LessonStatus.LOCKED) next.lessonProgress[0].status = LessonStatus.NOT_STARTED; }
}
