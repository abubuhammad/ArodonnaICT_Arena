"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitFinalAssessmentHandler = exports.getFinalAssessmentHandler = exports.submitModuleAssessmentHandler = exports.getModuleAssessmentHandler = exports.getLessonQuizHandler = exports.submitQuizHandler = exports.completeLessonNoQuizHandler = exports.viewLessonHandler = exports.startCourseHandler = void 0;
const service = __importStar(require("../services/courseProgressService"));
const prisma_1 = require("../lib/prisma");
const startCourseHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { enrollmentId } = req.params;
        yield service.startCourse(enrollmentId, req.user.id);
        res.json({ message: 'Course started' });
    }
    catch (err) {
        console.error('startCourseHandler error', err);
        res.status(500).json({ error: err.message || 'Failed to start course' });
    }
});
exports.startCourseHandler = startCourseHandler;
const viewLessonHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { enrollmentId, lessonId } = req.params;
        const lp = yield service.viewLesson(enrollmentId, req.user.id, lessonId);
        res.json({ message: 'Lesson viewed', lessonProgress: lp });
    }
    catch (err) {
        console.error('viewLessonHandler error', err);
        const msg = (err === null || err === void 0 ? void 0 : err.message) || '';
        if (msg.includes('Progress not found') || msg.includes('not found')) {
            res.status(404).json({ error: msg });
            return;
        }
        if (msg.includes('not owned') || msg.includes('invalid enrollment')) {
            res.status(403).json({ error: msg });
            return;
        }
        if (msg.includes('locked') || msg.includes('Lesson is locked')) {
            res.status(409).json({ error: msg });
            return;
        }
        if (msg.includes('Lesson progress')) {
            res.status(422).json({ error: msg });
            return;
        }
        res.status(500).json({ error: err.message || 'Failed to view lesson' });
    }
});
exports.viewLessonHandler = viewLessonHandler;
const completeLessonNoQuizHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { enrollmentId, lessonId } = req.params;
        const lp = yield service.completeLessonNoQuiz(enrollmentId, req.user.id, lessonId);
        res.json({ message: 'Lesson completed', lessonProgress: lp });
    }
    catch (err) {
        console.error('completeLessonNoQuizHandler error', err);
        // Map common domain errors to 4xx responses for clearer client handling
        const msg = (err === null || err === void 0 ? void 0 : err.message) || '';
        if (msg.includes('not found')) {
            res.status(404).json({ error: msg });
            return;
        }
        if (msg.includes('not owned') || msg.includes('invalid enrollment')) {
            res.status(403).json({ error: msg });
            return;
        }
        if (msg.includes('has a quiz')) {
            res.status(409).json({ error: msg });
            return;
        }
        if (msg.includes('locked') || msg.includes('Lesson is locked')) {
            res.status(409).json({ error: msg });
            return;
        }
        if (msg.includes('Lesson progress')) {
            res.status(422).json({ error: msg });
            return;
        }
        res.status(500).json({ error: err.message || 'Failed to complete lesson' });
    }
});
exports.completeLessonNoQuizHandler = completeLessonNoQuizHandler;
const submitQuizHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { enrollmentId, quizId } = req.params;
        const answers = req.body.answers;
        const result = yield service.submitQuiz(enrollmentId, req.user.id, quizId, answers);
        res.json({ message: 'Quiz submitted', result });
    }
    catch (err) {
        console.error('submitQuizHandler error', err);
        const msg = (err === null || err === void 0 ? void 0 : err.message) || '';
        if (msg.includes('not found')) {
            res.status(404).json({ error: msg });
            return;
        }
        if (msg.includes('Invalid enrollment')) {
            res.status(403).json({ error: msg });
            return;
        }
        if (msg.includes('No attempts remaining')) {
            res.status(409).json({ error: msg });
            return;
        }
        res.status(500).json({ error: err.message || 'Failed to submit quiz' });
    }
});
exports.submitQuizHandler = submitQuizHandler;
/** GET /enrollments/:enrollmentId/lessons/:lessonId/quiz
 * Returns the lesson's quiz with the answer key stripped, so it is safe to
 * render in the browser. Requires that the requester owns the enrollment. */
const getLessonQuizHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { enrollmentId, lessonId } = req.params;
        const enrollment = yield prisma_1.prisma.enrollment.findFirst({ where: { id: enrollmentId, userId: req.user.id } });
        if (!enrollment) {
            res.status(403).json({ error: 'Invalid enrollment' });
            return;
        }
        const quiz = yield prisma_1.prisma.quiz.findFirst({ where: { lessonId }, orderBy: { createdAt: 'desc' } });
        if (!quiz) {
            res.status(404).json({ error: 'No quiz found for this lesson' });
            return;
        }
        const questions = service.sanitizeQuestions(Array.isArray(quiz.legacyQuestions) ? quiz.legacyQuestions : []);
        res.json({ id: quiz.id, title: quiz.title, passingScore: quiz.passingScore, attemptsAllowed: quiz.attemptsAllowed, questions });
    }
    catch (err) {
        console.error('getLessonQuizHandler error', err);
        res.status(500).json({ error: err.message || 'Failed to fetch quiz' });
    }
});
exports.getLessonQuizHandler = getLessonQuizHandler;
/** GET /enrollments/:enrollmentId/modules/:moduleId/assessment
 * Sanitized module-assessment questions for the learner to answer. */
const getModuleAssessmentHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { enrollmentId, moduleId } = req.params;
        const enrollment = yield prisma_1.prisma.enrollment.findFirst({ where: { id: enrollmentId, userId: req.user.id }, include: { course: { include: { modules: true } } } });
        if (!enrollment) {
            res.status(403).json({ error: 'Invalid enrollment' });
            return;
        }
        const courseModule = enrollment.course.modules.find((m) => m.id === moduleId);
        if (!courseModule) {
            res.status(404).json({ error: 'Module not found' });
            return;
        }
        const assessment = courseModule.assessment || {};
        const questions = service.sanitizeQuestions(Array.isArray(assessment.questions) ? assessment.questions : []);
        res.json({ title: assessment.title || 'Module Assessment', passingScore: assessment.passingScore || 70, questions });
    }
    catch (err) {
        console.error('getModuleAssessmentHandler error', err);
        res.status(500).json({ error: err.message || 'Failed to fetch module assessment' });
    }
});
exports.getModuleAssessmentHandler = getModuleAssessmentHandler;
/** POST /enrollments/:enrollmentId/modules/:moduleId/assessment/submit
 * Grades the submitted answers server-side; the client never supplies a score. */
const submitModuleAssessmentHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { enrollmentId, moduleId } = req.params;
        const result = yield service.submitModuleAssessment(enrollmentId, req.user.id, moduleId, req.body.answers || []);
        res.json({ message: result.passed ? 'Module assessment passed' : 'Module assessment not passed', result });
    }
    catch (err) {
        console.error('submitModuleAssessmentHandler error', err);
        const msg = (err === null || err === void 0 ? void 0 : err.message) || '';
        if (msg.includes('not found')) {
            res.status(404).json({ error: msg });
            return;
        }
        if (msg.includes('Invalid enrollment')) {
            res.status(403).json({ error: msg });
            return;
        }
        if (msg.includes('must be passed') || msg.includes('no assessment')) {
            res.status(409).json({ error: msg });
            return;
        }
        res.status(500).json({ error: err.message || 'Failed to submit module assessment' });
    }
});
exports.submitModuleAssessmentHandler = submitModuleAssessmentHandler;
/** GET /enrollments/:enrollmentId/final-assessment
 * Sanitized final-assessment questions; only reachable once all modules are PASSED. */
const getFinalAssessmentHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { enrollmentId } = req.params;
        const enrollment = yield prisma_1.prisma.enrollment.findFirst({ where: { id: enrollmentId, userId: req.user.id }, include: { course: true } });
        if (!enrollment) {
            res.status(403).json({ error: 'Invalid enrollment' });
            return;
        }
        const state = yield service.ensureProgress(enrollmentId, req.user.id);
        const allModulesPassed = state.modules.every((m) => m.status === 'PASSED');
        const assessment = enrollment.course.finalAssessment || {};
        const questions = service.sanitizeQuestions(Array.isArray(assessment.questions) ? assessment.questions : []);
        res.json({ title: assessment.title || 'Final Assessment', passingScore: assessment.passingScore || 70, questions, unlocked: allModulesPassed });
    }
    catch (err) {
        console.error('getFinalAssessmentHandler error', err);
        res.status(500).json({ error: err.message || 'Failed to fetch final assessment' });
    }
});
exports.getFinalAssessmentHandler = getFinalAssessmentHandler;
/** POST /enrollments/:enrollmentId/final-assessment/submit
 * Grades the final assessment server-side; on a pass, marks the enrollment
 * COMPLETED and issues a certificate. */
const submitFinalAssessmentHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { enrollmentId } = req.params;
        const result = yield service.submitFinalAssessment(enrollmentId, req.user.id, req.body.answers || []);
        res.json({ message: result.passed ? 'Final assessment passed. Certificate issued.' : 'Final assessment not passed. Please try again.', result });
    }
    catch (err) {
        console.error('submitFinalAssessmentHandler error', err);
        const msg = (err === null || err === void 0 ? void 0 : err.message) || '';
        if (msg.includes('Invalid enrollment')) {
            res.status(403).json({ error: msg });
            return;
        }
        if (msg.includes('must be passed') || msg.includes('no final assessment')) {
            res.status(409).json({ error: msg });
            return;
        }
        res.status(500).json({ error: err.message || 'Failed to submit final assessment' });
    }
});
exports.submitFinalAssessmentHandler = submitFinalAssessmentHandler;
