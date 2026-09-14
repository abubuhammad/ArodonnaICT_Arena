"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleStatus = exports.LessonStatus = void 0;
exports.ensureProgress = ensureProgress;
exports.startCourse = startCourse;
exports.viewLesson = viewLesson;
exports.completeLessonNoQuiz = completeLessonNoQuiz;
exports.sanitizeQuestions = sanitizeQuestions;
exports.submitQuiz = submitQuiz;
exports.submitModuleAssessment = submitModuleAssessment;
exports.submitFinalAssessment = submitFinalAssessment;
exports.backfillMissingLessonProgress = backfillMissingLessonProgress;
const prisma_1 = require("../lib/prisma");
var LessonStatus;
(function (LessonStatus) {
    LessonStatus["NOT_STARTED"] = "NOT_STARTED";
    LessonStatus["IN_PROGRESS"] = "IN_PROGRESS";
    LessonStatus["PASSED"] = "PASSED";
    LessonStatus["FAILED"] = "FAILED";
    LessonStatus["LOCKED"] = "LOCKED";
})(LessonStatus || (exports.LessonStatus = LessonStatus = {}));
var ModuleStatus;
(function (ModuleStatus) {
    ModuleStatus["NOT_STARTED"] = "NOT_STARTED";
    ModuleStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ModuleStatus["PASSED"] = "PASSED";
    ModuleStatus["LOCKED"] = "LOCKED";
})(ModuleStatus || (exports.ModuleStatus = ModuleStatus = {}));
const progressModules = (value) => Array.isArray(value) ? value : [];
const normalizeProgress = (courseModules, existingModules, completed) => {
    const storedModules = progressModules(existingModules);
    return courseModules.map((courseModule, moduleIndex) => {
        const storedModule = storedModules.find((item) => { var _a; return String((_a = item.module) !== null && _a !== void 0 ? _a : item.moduleId) === String(courseModule.id); });
        const storedLessons = Array.isArray(storedModule === null || storedModule === void 0 ? void 0 : storedModule.lessonProgress)
            ? storedModule.lessonProgress
            : Array.isArray(storedModule === null || storedModule === void 0 ? void 0 : storedModule.lessons) ? storedModule.lessons : [];
        return {
            module: courseModule.id,
            status: completed
                ? ModuleStatus.PASSED
                : (storedModule === null || storedModule === void 0 ? void 0 : storedModule.status) || (moduleIndex === 0 ? ModuleStatus.NOT_STARTED : ModuleStatus.LOCKED),
            assessmentPassed: completed ? true : storedModule === null || storedModule === void 0 ? void 0 : storedModule.assessmentPassed,
            bestScore: storedModule === null || storedModule === void 0 ? void 0 : storedModule.bestScore,
            completedAt: storedModule === null || storedModule === void 0 ? void 0 : storedModule.completedAt,
            lessonProgress: (courseModule.lessons || []).map((lesson, lessonIndex) => {
                const storedLesson = storedLessons.find((item) => { var _a; return String((_a = item.lesson) !== null && _a !== void 0 ? _a : item.lessonId) === String(lesson.id); });
                return {
                    lesson: lesson.id,
                    status: completed
                        ? LessonStatus.PASSED
                        : (storedLesson === null || storedLesson === void 0 ? void 0 : storedLesson.status) || (moduleIndex === 0 && lessonIndex === 0 ? LessonStatus.NOT_STARTED : LessonStatus.LOCKED),
                    attempts: (storedLesson === null || storedLesson === void 0 ? void 0 : storedLesson.attempts) || 0,
                    bestScore: storedLesson === null || storedLesson === void 0 ? void 0 : storedLesson.bestScore,
                    completedAt: storedLesson === null || storedLesson === void 0 ? void 0 : storedLesson.completedAt,
                    lastViewedAt: storedLesson === null || storedLesson === void 0 ? void 0 : storedLesson.lastViewedAt,
                };
            }),
        };
    });
};
function loadProgress(enrollmentId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const cp = yield prisma_1.prisma.courseProgress.findUnique({ where: { enrollmentId } });
        if (!cp)
            throw new Error('Progress not found for this enrollment');
        return { cp, modules: progressModules(cp.modules || ((_a = cp.progress) === null || _a === void 0 ? void 0 : _a.modules)) };
    });
}
function saveProgress(enrollmentId, modules) {
    return __awaiter(this, void 0, void 0, function* () {
        const jsonModules = JSON.parse(JSON.stringify(modules));
        return prisma_1.prisma.courseProgress.update({ where: { enrollmentId }, data: { modules: jsonModules, progress: { modules: jsonModules } } });
    });
}
function syncEnrollment(enrollmentId, modules) {
    return __awaiter(this, void 0, void 0, function* () {
        const completed = modules.filter((module) => module.status === ModuleStatus.PASSED).length;
        const percentage = modules.length ? (completed / modules.length) * 100 : 0;
        yield prisma_1.prisma.enrollment.update({ where: { id: enrollmentId }, data: { progressPercentage: percentage, status: percentage >= 100 ? 'COMPLETED' : percentage > 0 ? 'IN_PROGRESS' : undefined } });
    });
}
function ensureProgress(enrollmentId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const enrollment = yield prisma_1.prisma.enrollment.findFirst({ where: { id: enrollmentId, userId }, include: { course: { include: { modules: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' } } } } } } } });
        if (!enrollment)
            throw new Error('Enrollment not found or not owned');
        let existing = yield prisma_1.prisma.courseProgress.findUnique({ where: { enrollmentId } });
        const completed = enrollment.progressPercentage >= 100 || enrollment.status === 'COMPLETED';
        if (!existing) {
            const modules = normalizeProgress(enrollment.course.modules, [], completed);
            existing = yield prisma_1.prisma.courseProgress.create({ data: { enrollmentId, progress: { modules }, modules, overallScore: 0 } });
        }
        const modules = normalizeProgress(enrollment.course.modules, existing.modules || ((_a = existing.progress) === null || _a === void 0 ? void 0 : _a.modules), completed);
        return { enrollment, existing, modules };
    });
}
function startCourse(enrollmentId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = yield ensureProgress(enrollmentId, userId);
        if (state.enrollment.status !== 'IN_PROGRESS') {
            yield prisma_1.prisma.enrollment.update({ where: { id: enrollmentId }, data: { status: 'IN_PROGRESS', startedAt: new Date() } });
        }
    });
}
function viewLesson(enrollmentId, userId, lessonId) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = yield ensureProgress(enrollmentId, userId);
        for (const module of state.modules) {
            const lesson = module.lessonProgress.find((item) => item.lesson === lessonId);
            if (!lesson)
                continue;
            if (lesson.status === LessonStatus.LOCKED)
                throw new Error('Lesson is locked');
            if (lesson.status === LessonStatus.NOT_STARTED)
                lesson.status = LessonStatus.IN_PROGRESS;
            lesson.lastViewedAt = new Date();
            yield saveProgress(enrollmentId, state.modules);
            return lesson;
        }
        throw new Error('Lesson progress not found for this enrollment');
    });
}
function completeLessonNoQuiz(enrollmentId, userId, lessonId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const lesson = yield prisma_1.prisma.lesson.findUnique({ where: { id: lessonId } });
        if (!lesson)
            throw new Error('Lesson not found');
        if (lesson.hasQuiz)
            throw new Error('This lesson has a quiz and must be completed via quiz submission, not marked complete directly');
        const state = yield ensureProgress(enrollmentId, userId);
        for (let moduleIndex = 0; moduleIndex < state.modules.length; moduleIndex++) {
            const module = state.modules[moduleIndex];
            const lessonIndex = module.lessonProgress.findIndex((item) => item.lesson === lessonId);
            if (lessonIndex < 0)
                continue;
            const lesson = module.lessonProgress[lessonIndex];
            if (lesson.status === LessonStatus.LOCKED)
                throw new Error('Lesson is locked');
            lesson.status = LessonStatus.PASSED;
            lesson.completedAt = new Date();
            if (((_a = module.lessonProgress[lessonIndex + 1]) === null || _a === void 0 ? void 0 : _a.status) === LessonStatus.LOCKED)
                module.lessonProgress[lessonIndex + 1].status = LessonStatus.NOT_STARTED;
            yield maybeCompleteModuleAndUnlock(state.modules, moduleIndex);
            yield saveProgress(enrollmentId, state.modules);
            yield syncEnrollment(enrollmentId, state.modules);
            return lesson;
        }
        throw new Error('Lesson not part of enrollment progress');
    });
}
// --- Shared grading helpers -------------------------------------------------
/** Grades a set of MCQ-style questions against submitted answers. Never trusts a
 * client-supplied score/pass boolean — always recomputed here from the answer key. */
function gradeQuestions(questions, answers) {
    const list = Array.isArray(questions) ? questions : [];
    if (!list.length)
        return { score: 0, correctCount: 0, total: 0 };
    const correctCount = list.filter((question, index) => {
        var _a, _b;
        const submitted = answers === null || answers === void 0 ? void 0 : answers[index];
        const key = (_b = (_a = question === null || question === void 0 ? void 0 : question.correctAnswer) !== null && _a !== void 0 ? _a : question === null || question === void 0 ? void 0 : question.correct) !== null && _b !== void 0 ? _b : question === null || question === void 0 ? void 0 : question.answer;
        return submitted !== undefined && submitted !== null && String(submitted) === String(key);
    }).length;
    return { score: Math.round((correctCount / list.length) * 100), correctCount, total: list.length };
}
/** Strips answer keys from a question set before it is sent to a learner. */
function sanitizeQuestions(questions) {
    const list = Array.isArray(questions) ? questions : [];
    return list.map((_a) => {
        var { correctAnswer, correct, answer } = _a, rest = __rest(_a, ["correctAnswer", "correct", "answer"]);
        return rest;
    });
}
function autoGrade(questions, answers) {
    return gradeQuestions(questions, answers).score;
}
function submitQuiz(enrollmentId, userId, quizId, answers) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
            const quiz = yield tx.quiz.findUnique({ where: { id: quizId } });
            const enrollment = yield tx.enrollment.findFirst({ where: { id: enrollmentId, userId } });
            if (!quiz)
                throw new Error('Quiz not found');
            if (!enrollment)
                throw new Error('Invalid enrollment');
            const attemptNo = (yield tx.quizAttempt.count({ where: { quizId, userId } })) + 1;
            const questions = Array.isArray(quiz.legacyQuestions) ? quiz.legacyQuestions : [];
            const config = quiz.config || {};
            const attemptsAllowed = Number(config.attemptsAllowed || quiz.attemptsAllowed || 3);
            if (attemptNo > attemptsAllowed)
                throw new Error('No attempts remaining for this quiz');
            const score = config.grading === 'auto' || quiz.gradingMode === 'auto' ? autoGrade(questions, answers || []) : undefined;
            const attempt = yield tx.quizAttempt.create({ data: { quizId, userId, enrollmentId, answers, attemptNo, score, status: score === undefined ? 'AWAITING_MANUAL_REVIEW' : 'GRADED', gradedAt: score === undefined ? undefined : new Date() } });
            if (score === undefined)
                return { attemptId: attempt.id, status: attempt.status };
            const state = yield ensureProgress(enrollmentId, userId);
            for (const module of state.modules) {
                const lesson = module.lessonProgress.find((item) => item.lesson === quiz.lessonId);
                if (!lesson)
                    continue;
                lesson.attempts = (lesson.attempts || 0) + 1;
                lesson.bestScore = Math.max(lesson.bestScore || 0, score);
                lesson.status = score >= Number(config.passingScore || quiz.passingScore || 70) ? LessonStatus.PASSED : lesson.attempts >= attemptsAllowed ? LessonStatus.FAILED : LessonStatus.IN_PROGRESS;
                if (lesson.status === LessonStatus.PASSED)
                    yield maybeCompleteModuleAndUnlock(state.modules, state.modules.indexOf(module));
                yield tx.courseProgress.update({ where: { enrollmentId }, data: { modules: state.modules, progress: { modules: state.modules } } });
                yield tx.enrollment.update({ where: { id: enrollmentId }, data: { progressPercentage: state.modules.filter((item) => item.status === ModuleStatus.PASSED).length / Math.max(state.modules.length, 1) * 100 } });
                return { attemptId: attempt.id, score, status: lesson.status, attemptsRemaining: Math.max(0, attemptsAllowed - lesson.attempts) };
            }
            throw new Error('LessonProgress not found');
        }));
    });
}
/** Internal: applies a (server-derived) pass/fail + score to a module's progress record. */
function completeModuleAssessment(enrollmentId, userId, moduleId, assessmentPassed, score) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = yield ensureProgress(enrollmentId, userId);
        const index = state.modules.findIndex((module) => module.module === moduleId);
        if (index < 0)
            throw new Error('Module progress not found');
        const module = state.modules[index];
        if (!module.lessonProgress.every((lesson) => lesson.status === LessonStatus.PASSED))
            throw new Error('All lessons must be passed before completing module assessment');
        module.assessmentPassed = assessmentPassed;
        if (typeof score === 'number')
            module.bestScore = Math.max(module.bestScore || 0, score);
        module.status = assessmentPassed ? ModuleStatus.PASSED : ModuleStatus.IN_PROGRESS;
        if (assessmentPassed)
            module.completedAt = new Date();
        yield maybeCompleteModuleAndUnlock(state.modules, index);
        yield saveProgress(enrollmentId, state.modules);
        yield syncEnrollment(enrollmentId, state.modules);
        return { passed: assessmentPassed, status: module.status, assessmentPassed, score, finalAssessmentUnlocked: state.modules.every((item) => item.status === ModuleStatus.PASSED) };
    });
}
/** Public entry point: grades a module assessment attempt server-side against the
 * module's stored answer key, then applies the result. Never trusts a client score. */
function submitModuleAssessment(enrollmentId, userId, moduleId, answers) {
    return __awaiter(this, void 0, void 0, function* () {
        const enrollment = yield prisma_1.prisma.enrollment.findFirst({ where: { id: enrollmentId, userId }, include: { course: { include: { modules: true } } } });
        if (!enrollment)
            throw new Error('Invalid enrollment');
        const courseModule = enrollment.course.modules.find((m) => m.id === moduleId);
        if (!courseModule)
            throw new Error('Module not found for this course');
        const assessment = courseModule.assessment || {};
        const questions = Array.isArray(assessment.questions) ? assessment.questions : [];
        if (!questions.length)
            throw new Error('This module has no assessment configured');
        const { score } = gradeQuestions(questions, answers || []);
        const passingScore = Number(assessment.passingScore || 70);
        const passed = score >= passingScore;
        const result = yield completeModuleAssessment(enrollmentId, userId, moduleId, passed, score);
        return Object.assign(Object.assign({}, result), { score, passingScore });
    });
}
/** Public entry point: grades the course's final assessment server-side, and on a
 * pass marks the enrollment COMPLETED and issues a certificate. */
function submitFinalAssessment(enrollmentId, userId, answers) {
    return __awaiter(this, void 0, void 0, function* () {
        const enrollment = yield prisma_1.prisma.enrollment.findFirst({ where: { id: enrollmentId, userId }, include: { course: true } });
        if (!enrollment)
            throw new Error('Invalid enrollment');
        const state = yield ensureProgress(enrollmentId, userId);
        if (!state.modules.every((module) => module.status === ModuleStatus.PASSED)) {
            throw new Error('All modules must be passed before attempting the final assessment');
        }
        const finalAssessment = enrollment.course.finalAssessment || {};
        const questions = Array.isArray(finalAssessment.questions) ? finalAssessment.questions : [];
        if (!questions.length)
            throw new Error('This course has no final assessment configured');
        const { score } = gradeQuestions(questions, answers || []);
        const passingScore = Number(finalAssessment.passingScore || 70);
        const passed = score >= passingScore;
        return prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
            const updated = yield tx.enrollment.update({
                where: { id: enrollmentId },
                data: {
                    finalAssessmentPassed: passed,
                    finalScore: score,
                    status: passed ? 'COMPLETED' : enrollment.status,
                },
            });
            let certificate = null;
            if (passed) {
                const existing = yield tx.certificate.findFirst({ where: { enrollmentId } });
                if (existing) {
                    certificate = existing;
                }
                else {
                    const id = randomUUIDCompat();
                    const fileUrl = `${process.env.CERTIFICATE_BASE_URL || 'http://localhost:5000/certificates'}/${id}.pdf`;
                    certificate = yield tx.certificate.create({ data: { id, enrollmentId, serial: id, fileUrl, issuedAt: new Date() } });
                    yield tx.enrollment.update({ where: { id: enrollmentId }, data: { certificate: { id, issuedAt: certificate.issuedAt, downloadUrl: fileUrl } } });
                }
            }
            return { passed, score, passingScore, status: updated.status, certificate };
        }));
    });
}
function randomUUIDCompat() {
    // Avoids a top-level crypto import while keeping this file dependency-light.
    const { randomUUID } = require('crypto');
    return randomUUID();
}
function maybeCompleteModuleAndUnlock(modules, index) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const module = modules[index];
        if (!module.lessonProgress.every((lesson) => lesson.status === LessonStatus.PASSED) || (module.assessmentPassed === false))
            return;
        module.status = ModuleStatus.PASSED;
        module.completedAt = module.completedAt || new Date();
        const next = modules[index + 1];
        if (next) {
            next.status = ModuleStatus.NOT_STARTED;
            if (((_a = next.lessonProgress[0]) === null || _a === void 0 ? void 0 : _a.status) === LessonStatus.LOCKED)
                next.lessonProgress[0].status = LessonStatus.NOT_STARTED;
        }
    });
}
function backfillMissingLessonProgress() {
    return __awaiter(this, void 0, void 0, function* () { return { modified: 0 }; });
}
