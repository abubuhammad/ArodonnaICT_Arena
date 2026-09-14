"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/enrollment.routes.ts
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const enrollment_controller_1 = require("../controllers/enrollment.controller");
const courseProgress_controller_1 = require("../controllers/courseProgress.controller");
const router = express_1.default.Router();
// User enrollment routes
router.post("/", auth_1.authenticateUser, enrollment_controller_1.createEnrollment);
router.get("/my-courses", auth_1.authenticateUser, enrollment_controller_1.getUserEnrollments);
// Course progress flow endpoints (all progress mutations are graded/validated
// server-side in courseProgressService — nothing here trusts a client score).
router.post('/:enrollmentId/start', auth_1.authenticateUser, courseProgress_controller_1.startCourseHandler);
router.post('/:enrollmentId/lessons/:lessonId/view', auth_1.authenticateUser, courseProgress_controller_1.viewLessonHandler);
router.post('/:enrollmentId/lessons/:lessonId/complete', auth_1.authenticateUser, courseProgress_controller_1.completeLessonNoQuizHandler);
router.get('/:enrollmentId/lessons/:lessonId/quiz', auth_1.authenticateUser, courseProgress_controller_1.getLessonQuizHandler);
router.post('/:enrollmentId/quizzes/:quizId/submit', auth_1.authenticateUser, courseProgress_controller_1.submitQuizHandler);
router.get('/:enrollmentId/modules/:moduleId/assessment', auth_1.authenticateUser, courseProgress_controller_1.getModuleAssessmentHandler);
router.post('/:enrollmentId/modules/:moduleId/assessment/submit', auth_1.authenticateUser, courseProgress_controller_1.submitModuleAssessmentHandler);
router.get('/:enrollmentId/final-assessment', auth_1.authenticateUser, courseProgress_controller_1.getFinalAssessmentHandler);
router.post('/:enrollmentId/final-assessment/submit', auth_1.authenticateUser, courseProgress_controller_1.submitFinalAssessmentHandler);
router.get('/:enrollmentId/progress', auth_1.authenticateUser, enrollment_controller_1.getEnrollmentProgress);
exports.default = router;
