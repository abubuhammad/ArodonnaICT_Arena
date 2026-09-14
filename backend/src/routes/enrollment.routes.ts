// src/routes/enrollment.routes.ts
import express from "express";
import { authenticateUser } from "../middlewares/auth";
import {
  createEnrollment,
  getUserEnrollments,
  getEnrollmentProgress,
} from "../controllers/enrollment.controller";
import {
  startCourseHandler,
  viewLessonHandler,
  completeLessonNoQuizHandler,
  submitQuizHandler,
  getLessonQuizHandler,
  getModuleAssessmentHandler,
  submitModuleAssessmentHandler,
  getFinalAssessmentHandler,
  submitFinalAssessmentHandler,
} from '../controllers/courseProgress.controller';

const router = express.Router();

// User enrollment routes
router.post("/", authenticateUser, createEnrollment);
router.get("/my-courses", authenticateUser, getUserEnrollments);

// Course progress flow endpoints (all progress mutations are graded/validated
// server-side in courseProgressService — nothing here trusts a client score).
router.post('/:enrollmentId/start', authenticateUser, startCourseHandler);
router.post('/:enrollmentId/lessons/:lessonId/view', authenticateUser, viewLessonHandler);
router.post('/:enrollmentId/lessons/:lessonId/complete', authenticateUser, completeLessonNoQuizHandler);
router.get('/:enrollmentId/lessons/:lessonId/quiz', authenticateUser, getLessonQuizHandler);
router.post('/:enrollmentId/quizzes/:quizId/submit', authenticateUser, submitQuizHandler);
router.get('/:enrollmentId/modules/:moduleId/assessment', authenticateUser, getModuleAssessmentHandler);
router.post('/:enrollmentId/modules/:moduleId/assessment/submit', authenticateUser, submitModuleAssessmentHandler);
router.get('/:enrollmentId/final-assessment', authenticateUser, getFinalAssessmentHandler);
router.post('/:enrollmentId/final-assessment/submit', authenticateUser, submitFinalAssessmentHandler);
router.get('/:enrollmentId/progress', authenticateUser, getEnrollmentProgress);

export default router;
