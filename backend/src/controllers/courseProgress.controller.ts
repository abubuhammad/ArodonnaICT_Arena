import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as service from '../services/courseProgressService';
import { prisma } from '../lib/prisma';

export const startCourseHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { enrollmentId } = req.params;
    await service.startCourse(enrollmentId, req.user.id);
    res.json({ message: 'Course started' });
  } catch (err: any) {
    console.error('startCourseHandler error', err);
    res.status(500).json({ error: err.message || 'Failed to start course' });
  }
};

export const viewLessonHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { enrollmentId, lessonId } = req.params;
    const lp = await service.viewLesson(enrollmentId, req.user.id, lessonId);
    res.json({ message: 'Lesson viewed', lessonProgress: lp });
  } catch (err: any) {
    console.error('viewLessonHandler error', err);
    const msg = err?.message || '';
    if (msg.includes('Progress not found') || msg.includes('not found')) { res.status(404).json({ error: msg }); return; }
    if (msg.includes('not owned') || msg.includes('invalid enrollment')) { res.status(403).json({ error: msg }); return; }
    if (msg.includes('locked') || msg.includes('Lesson is locked')) { res.status(409).json({ error: msg }); return; }
    if (msg.includes('Lesson progress')) { res.status(422).json({ error: msg }); return; }
    res.status(500).json({ error: err.message || 'Failed to view lesson' });
  }
};

export const completeLessonNoQuizHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { enrollmentId, lessonId } = req.params;
    const lp = await service.completeLessonNoQuiz(enrollmentId, req.user.id, lessonId);
    res.json({ message: 'Lesson completed', lessonProgress: lp });
  } catch (err: any) {
    console.error('completeLessonNoQuizHandler error', err);
    // Map common domain errors to 4xx responses for clearer client handling
    const msg = err?.message || '';
    if (msg.includes('not found')) { res.status(404).json({ error: msg }); return; }
    if (msg.includes('not owned') || msg.includes('invalid enrollment')) { res.status(403).json({ error: msg }); return; }
    if (msg.includes('has a quiz')) { res.status(409).json({ error: msg }); return; }
    if (msg.includes('locked') || msg.includes('Lesson is locked')) { res.status(409).json({ error: msg }); return; }
    if (msg.includes('Lesson progress')) { res.status(422).json({ error: msg }); return; }
    res.status(500).json({ error: err.message || 'Failed to complete lesson' });
  }
};

export const submitQuizHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { enrollmentId, quizId } = req.params;
    const answers = req.body.answers;
    const result = await service.submitQuiz(enrollmentId, req.user.id, quizId, answers);
    res.json({ message: 'Quiz submitted', result });
  } catch (err: any) {
    console.error('submitQuizHandler error', err);
    const msg = err?.message || '';
    if (msg.includes('not found')) { res.status(404).json({ error: msg }); return; }
    if (msg.includes('Invalid enrollment')) { res.status(403).json({ error: msg }); return; }
    if (msg.includes('No attempts remaining')) { res.status(409).json({ error: msg }); return; }
    res.status(500).json({ error: err.message || 'Failed to submit quiz' });
  }
};

/** GET /enrollments/:enrollmentId/lessons/:lessonId/quiz
 * Returns the lesson's quiz with the answer key stripped, so it is safe to
 * render in the browser. Requires that the requester owns the enrollment. */
export const getLessonQuizHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { enrollmentId, lessonId } = req.params;
    const enrollment = await prisma.enrollment.findFirst({ where: { id: enrollmentId, userId: req.user.id } });
    if (!enrollment) { res.status(403).json({ error: 'Invalid enrollment' }); return; }
    const quiz = await prisma.quiz.findFirst({ where: { lessonId }, orderBy: { createdAt: 'desc' } });
    if (!quiz) { res.status(404).json({ error: 'No quiz found for this lesson' }); return; }
    const questions = service.sanitizeQuestions(Array.isArray(quiz.legacyQuestions) ? (quiz.legacyQuestions as any[]) : []);
    res.json({ id: quiz.id, title: quiz.title, passingScore: quiz.passingScore, attemptsAllowed: quiz.attemptsAllowed, questions });
  } catch (err: any) {
    console.error('getLessonQuizHandler error', err);
    res.status(500).json({ error: err.message || 'Failed to fetch quiz' });
  }
};

/** GET /enrollments/:enrollmentId/modules/:moduleId/assessment
 * Sanitized module-assessment questions for the learner to answer. */
export const getModuleAssessmentHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { enrollmentId, moduleId } = req.params;
    const enrollment = await prisma.enrollment.findFirst({ where: { id: enrollmentId, userId: req.user.id }, include: { course: { include: { modules: true } } } });
    if (!enrollment) { res.status(403).json({ error: 'Invalid enrollment' }); return; }
    const courseModule = enrollment.course.modules.find((m) => m.id === moduleId);
    if (!courseModule) { res.status(404).json({ error: 'Module not found' }); return; }
    const assessment: any = courseModule.assessment || {};
    const questions = service.sanitizeQuestions(Array.isArray(assessment.questions) ? assessment.questions : []);
    res.json({ title: assessment.title || 'Module Assessment', passingScore: assessment.passingScore || 70, questions });
  } catch (err: any) {
    console.error('getModuleAssessmentHandler error', err);
    res.status(500).json({ error: err.message || 'Failed to fetch module assessment' });
  }
};

/** POST /enrollments/:enrollmentId/modules/:moduleId/assessment/submit
 * Grades the submitted answers server-side; the client never supplies a score. */
export const submitModuleAssessmentHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { enrollmentId, moduleId } = req.params;
    const result = await service.submitModuleAssessment(enrollmentId, req.user.id, moduleId, req.body.answers || []);
    res.json({ message: result.passed ? 'Module assessment passed' : 'Module assessment not passed', result });
  } catch (err: any) {
    console.error('submitModuleAssessmentHandler error', err);
    const msg = err?.message || '';
    if (msg.includes('not found')) { res.status(404).json({ error: msg }); return; }
    if (msg.includes('Invalid enrollment')) { res.status(403).json({ error: msg }); return; }
    if (msg.includes('must be passed') || msg.includes('no assessment')) { res.status(409).json({ error: msg }); return; }
    res.status(500).json({ error: err.message || 'Failed to submit module assessment' });
  }
};

/** GET /enrollments/:enrollmentId/final-assessment
 * Sanitized final-assessment questions; only reachable once all modules are PASSED. */
export const getFinalAssessmentHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { enrollmentId } = req.params;
    const enrollment = await prisma.enrollment.findFirst({ where: { id: enrollmentId, userId: req.user.id }, include: { course: true } });
    if (!enrollment) { res.status(403).json({ error: 'Invalid enrollment' }); return; }
    const state = await service.ensureProgress(enrollmentId, req.user.id);
    const allModulesPassed = state.modules.every((m: any) => m.status === 'PASSED');
    const assessment: any = enrollment.course.finalAssessment || {};
    const questions = service.sanitizeQuestions(Array.isArray(assessment.questions) ? assessment.questions : []);
    res.json({ title: assessment.title || 'Final Assessment', passingScore: assessment.passingScore || 70, questions, unlocked: allModulesPassed });
  } catch (err: any) {
    console.error('getFinalAssessmentHandler error', err);
    res.status(500).json({ error: err.message || 'Failed to fetch final assessment' });
  }
};

/** POST /enrollments/:enrollmentId/final-assessment/submit
 * Grades the final assessment server-side; on a pass, marks the enrollment
 * COMPLETED and issues a certificate. */
export const submitFinalAssessmentHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { enrollmentId } = req.params;
    const result = await service.submitFinalAssessment(enrollmentId, req.user.id, req.body.answers || []);
    res.json({ message: result.passed ? 'Final assessment passed. Certificate issued.' : 'Final assessment not passed. Please try again.', result });
  } catch (err: any) {
    console.error('submitFinalAssessmentHandler error', err);
    const msg = err?.message || '';
    if (msg.includes('Invalid enrollment')) { res.status(403).json({ error: msg }); return; }
    if (msg.includes('must be passed') || msg.includes('no final assessment')) { res.status(409).json({ error: msg }); return; }
    res.status(500).json({ error: err.message || 'Failed to submit final assessment' });
  }
};
