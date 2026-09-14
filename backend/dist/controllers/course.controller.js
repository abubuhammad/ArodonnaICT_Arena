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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnrolledCourses = exports.updateCourse = exports.updateCourseStatus = exports.deleteCourse = exports.uploadThumbnail = exports.getCategories = exports.getPublicCourses = exports.getCourseModules = exports.getUserCourses = exports.enrollInCourse = exports.getCourses = exports.getCourseById = exports.importMarkdownCourse = exports.importCourse = exports.createCourse = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = require("../lib/prisma");
const courseProgressService_1 = require("../services/courseProgressService");
const courseMarkdownParser_1 = require("../services/courseMarkdownParser");
const courseInclude = {
    instructor: { select: { id: true, name: true, title: true, avatar: true, isAvailableForCall: true, locale: true, currency: true } },
    category: true,
    modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" }, include: { quizzes: true } } },
    },
};
const categoryIdFor = (category) => __awaiter(void 0, void 0, void 0, function* () {
    const value = String(category || "Uncategorized");
    const existing = yield prisma_1.prisma.category.findFirst({ where: { OR: [{ id: value }, { name: value }] } });
    return (existing === null || existing === void 0 ? void 0 : existing.id) || (yield prisma_1.prisma.category.create({ data: { name: value } })).id;
});
const validateCoursePayload = (payload) => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
        return "Course payload must be a JSON object";
    if (!String(payload.title || "").trim())
        return "Course title is required";
    if (!String(payload.description || "").trim())
        return "Course description is required";
    if (!String(payload.category || "").trim())
        return "Course category is required";
    if (!String(payload.thumbnail || "").trim())
        return "Course thumbnail is required";
    if (!Array.isArray(payload.modules) || payload.modules.length === 0)
        return "At least one course module is required";
    for (const [moduleIndex, module] of payload.modules.entries()) {
        if (!module || !String(module.title || "").trim() || !String(module.description || "").trim())
            return `Module ${moduleIndex + 1} needs a title and description`;
        if (!Array.isArray(module.lessons) || module.lessons.length === 0)
            return `Module ${moduleIndex + 1} needs at least one lesson`;
        for (const [lessonIndex, lesson] of module.lessons.entries()) {
            if (!lesson || !String(lesson.title || "").trim() || !String(lesson.description || "").trim() || !String(lesson.content || "").trim())
                return `Module ${moduleIndex + 1}, lesson ${lessonIndex + 1} needs a title, description, and content`;
        }
    }
    if (payload.price !== undefined && (!Number.isFinite(Number(payload.price)) || Number(payload.price) < 0))
        return "Course price must be a non-negative number";
    if (payload.finalAssessment !== undefined && payload.finalAssessment !== null) {
        const assessment = payload.finalAssessment;
        if (!assessment || !String(assessment.title || "").trim() || !String(assessment.description || "").trim() || Number(assessment.timeLimit) <= 0 || Number(assessment.passingScore) < 0 || Number(assessment.passingScore) > 100)
            return "Final assessment details are invalid";
        if (!Array.isArray(assessment.questions) || assessment.questions.some((question) => !question || !String(question.question || "").trim() || !Array.isArray(question.options) || question.options.filter((option) => String(option || "").trim()).length < 2 || !String(question.correctAnswer || "").trim() || !question.options.includes(question.correctAnswer)))
            return "Every final assessment question needs two options and a matching correct answer";
    }
    return null;
};
/** Is this requester allowed to see answer keys for this course (quiz answers,
 * module/final assessment answers)? Only the owning instructor or an admin. */
const isPrivilegedForCourse = (user, course) => {
    if (!user)
        return false;
    const role = String(user.role || "").toUpperCase();
    if (role === "ADMIN")
        return true;
    return role === "INSTRUCTOR" && course.instructorId === user.id;
};
/** Strips answer keys from a lesson's quizzes and a module's/course's assessment
 * JSON before sending to a non-privileged viewer (student, public browsing). */
const sanitizeModules = (modules) => (modules || []).map((module) => (Object.assign(Object.assign({}, module), { assessment: module.assessment
        ? Object.assign(Object.assign({}, module.assessment), { questions: (0, courseProgressService_1.sanitizeQuestions)(module.assessment.questions) }) : module.assessment, lessons: (module.lessons || []).map((lesson) => (Object.assign(Object.assign({}, lesson), { quizzes: (lesson.quizzes || []).map((quiz) => (Object.assign(Object.assign({}, quiz), { legacyQuestions: (0, courseProgressService_1.sanitizeQuestions)(Array.isArray(quiz.legacyQuestions) ? quiz.legacyQuestions : []) }))) }))) })));
const shapeCourseResponse = (course, progress = 0, privileged = false) => {
    var _a;
    return ({
        id: course.id,
        _id: course.id,
        title: course.title,
        description: course.description,
        status: course.status || "DRAFT",
        publishAt: course.publishAt || null,
        instructor: course.instructor,
        category: ((_a = course.category) === null || _a === void 0 ? void 0 : _a.name) || course.category,
        price: course.price,
        enrolledStudents: course.enrolledStudents || [],
        isFree: course.isFree,
        modules: privileged ? (course.modules || []) : sanitizeModules(course.modules || []),
        thumbnail: course.thumbnail || "/images/course-default.jpg",
        level: course.level || "Beginner",
        duration: course.duration || "0 hours",
        progress,
        finalAssessment: course.finalAssessment
            ? privileged
                ? course.finalAssessment
                : Object.assign(Object.assign({}, course.finalAssessment), { questions: (0, courseProgressService_1.sanitizeQuestions)(course.finalAssessment.questions) })
            : null,
    });
};
/** Maps the instructor course-builder's per-lesson quiz fields (a single
 * quizQuestion/quizOptions/correctAnswer, kept for UI backwards-compatibility)
 * plus an optional richer `quiz.questions[]` array into a real nested Quiz
 * create, so answers are actually persisted instead of silently dropped. */
const lessonQuizCreate = (lesson) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const questions = [];
    if (Array.isArray((_a = lesson.quiz) === null || _a === void 0 ? void 0 : _a.questions) && lesson.quiz.questions.length) {
        for (const q of lesson.quiz.questions) {
            if (!(q === null || q === void 0 ? void 0 : q.text) && !(q === null || q === void 0 ? void 0 : q.quizQuestion))
                continue;
            questions.push({
                text: q.text || q.quizQuestion,
                options: Array.isArray(q.options) ? q.options : Array.isArray(q.quizOptions) ? q.quizOptions : [],
                correctAnswer: (_c = (_b = q.correctAnswer) !== null && _b !== void 0 ? _b : q.correct) !== null && _c !== void 0 ? _c : q.answer,
            });
        }
    }
    else if (lesson.quizQuestion) {
        questions.push({
            text: lesson.quizQuestion,
            options: Array.isArray(lesson.quizOptions) ? lesson.quizOptions : [],
            correctAnswer: lesson.correctAnswer,
        });
    }
    if (!questions.length)
        return undefined;
    return {
        create: [{
                title: ((_d = lesson.quiz) === null || _d === void 0 ? void 0 : _d.title) || `${lesson.title || "Lesson"} Quiz`,
                passingScore: Number((_f = (_e = lesson.quiz) === null || _e === void 0 ? void 0 : _e.passingScore) !== null && _f !== void 0 ? _f : 100),
                attemptsAllowed: Number((_h = (_g = lesson.quiz) === null || _g === void 0 ? void 0 : _g.attemptsAllowed) !== null && _h !== void 0 ? _h : 3),
                gradingMode: ((_j = lesson.quiz) === null || _j === void 0 ? void 0 : _j.gradingMode) || "auto",
                legacyQuestions: questions,
            }],
    };
};
const moduleData = (module, index) => {
    var _a;
    return ({
        title: module.title,
        description: module.description || "",
        order: typeof module.order === "number" ? module.order : index,
        assessment: (_a = module.assessment) !== null && _a !== void 0 ? _a : null,
        lessons: { create: Array.isArray(module.lessons) ? module.lessons.map((lesson, lessonIndex) => {
                const quizzes = lessonQuizCreate(lesson);
                return Object.assign({ title: lesson.title, description: lesson.description || "", lessonType: lesson.lessonType || "text-only", content: lesson.content || "", videoUrl: lesson.videoUrl || null, duration: lesson.duration || null, order: typeof lesson.order === "number" ? lesson.order : lessonIndex, hasQuiz: Boolean(lesson.hasQuiz) || Boolean(quizzes) }, (quizzes ? { quizzes } : {}));
            }) : [] },
    });
};
const createCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const validationError = validateCoursePayload(req.body);
        if (validationError)
            return res.status(400).json({ error: validationError });
        const { title, description, instructor, category, price, isFree, modules = [], thumbnail, duration, level, finalAssessment } = req.body;
        const instructorId = instructor || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!instructorId)
            return res.status(400).json({ error: "Instructor is required" });
        const categoryId = yield categoryIdFor(category);
        const course = yield prisma_1.prisma.course.create({
            data: { slug: `${String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`, title, description, instructorId, categoryId, price: Number(price || 0), isFree: Boolean(isFree), thumbnail, duration: duration || "0 hours", level: level || "Beginner", finalAssessment: finalAssessment || null, modules: { create: modules.map(moduleData) } },
            include: courseInclude,
        });
        res.status(201).json({ message: "Course created successfully", course: shapeCourseResponse(course, 0, true) });
    }
    catch (error) {
        console.error("Course creation error:", error);
        res.status(500).json({ error: "Failed to create course" });
    }
});
exports.createCourse = createCourse;
exports.importCourse = exports.createCourse;
const importMarkdownCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file)
            return res.status(400).json({ error: "A Markdown course file is required" });
        const markdown = req.file.buffer.toString("utf8");
        req.body = (0, courseMarkdownParser_1.parseCourseMarkdown)(markdown);
        return (0, exports.createCourse)(req, res);
    }
    catch (error) {
        return res.status(400).json({ error: (error === null || error === void 0 ? void 0 : error.message) || "Invalid Markdown course template" });
    }
});
exports.importMarkdownCourse = importMarkdownCourse;
const getCourseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const course = yield prisma_1.prisma.course.findUnique({ where: { id: req.params.courseId }, include: courseInclude });
        if (!course)
            return res.status(404).json({ error: "Course not found" });
        const privileged = isPrivilegedForCourse(req.user, course);
        res.json(shapeCourseResponse(course, 0, privileged));
    }
    catch (error) {
        console.error("Error fetching course:", error);
        res.status(500).json({ error: "Failed to fetch course details" });
    }
});
exports.getCourseById = getCourseById;
const getCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { instructor, status } = req.query;
        const instructorId = instructor || (((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === null || _b === void 0 ? void 0 : _b.toUpperCase()) === "INSTRUCTOR" ? req.user.id : undefined);
        const courses = yield prisma_1.prisma.course.findMany({ where: { instructorId, status: status === null || status === void 0 ? void 0 : status.toUpperCase() }, orderBy: { createdAt: "desc" }, include: courseInclude });
        res.json(courses.map((course) => shapeCourseResponse(course, 0, isPrivilegedForCourse(req.user, course))));
    }
    catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ error: "Failed to fetch courses" });
    }
});
exports.getCourses = getCourses;
const enrollInCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { courseId, reference, paymentMethod } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const course = yield prisma_1.prisma.course.findUnique({ where: { id: courseId } });
        if (!course)
            return res.status(404).json({ error: "Course not found" });
        if (course.instructorId === userId)
            return res.status(400).json({ error: "Cannot enroll in your own course" });
        if (yield prisma_1.prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } }))
            return res.status(400).json({ error: "Already enrolled in this course" });
        if (course.isFree) {
            yield prisma_1.prisma.enrollment.create({ data: { userId, courseId, paymentStatus: "WAIVED" } });
            return res.json({ message: "Successfully enrolled in free course" });
        }
        if (!reference)
            return res.status(400).json({ error: "Payment reference required" });
        const secret = process.env.PAYSTACK_SECRET;
        if (!secret)
            return res.status(500).json({ error: "PAYSTACK_SECRET is not configured" });
        const verified = yield axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, { headers: { Authorization: `Bearer ${secret}` } });
        if (((_c = (_b = verified.data) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.status) !== "success")
            return res.status(400).json({ error: "Payment verification failed" });
        yield prisma_1.prisma.enrollment.create({ data: { userId, courseId, paymentStatus: "PAID", paymentMethod: String(paymentMethod || "PAYSTACK").toUpperCase(), paymentReference: reference, amountPaid: Number(verified.data.data.amount || 0) } });
        res.json({ message: "Payment verified and enrollment successful", amountPaid: Number(verified.data.data.amount || 0) });
    }
    catch (error) {
        console.error("Enroll error:", error);
        res.status(500).json({ error: "Enrollment process failed" });
    }
});
exports.enrollInCourse = enrollInCourse;
const getUserCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const enrollments = yield prisma_1.prisma.enrollment.findMany({ where: { userId: req.params.userId }, include: { course: { include: { instructor: { select: { name: true } }, category: true } } } });
        res.json(enrollments.map((e) => ({ id: e.course.id, title: e.course.title, description: e.course.description, instructor: e.course.instructor.name, thumbnail: e.course.thumbnail || "/images/course-default.jpg", price: e.course.price, isFree: e.course.isFree, level: e.course.level || "Beginner", duration: e.course.duration || "0 hours", category: e.course.category.name, progress: e.progressPercentage })));
    }
    catch (_a) {
        res.status(500).json({ error: "Unable to fetch enrolled courses" });
    }
});
exports.getUserCourses = getUserCourses;
const getCourseModules = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.json(yield prisma_1.prisma.module.findMany({ where: { courseId: req.params.courseId }, orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } }));
    }
    catch (_a) {
        res.status(500).json({ error: "Failed to fetch course modules" });
    }
});
exports.getCourseModules = getCourseModules;
const getPublicCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courses = yield prisma_1.prisma.course.findMany({ where: { status: "PUBLISHED", OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }], category: req.query.category ? { name: String(req.query.category) } : undefined }, orderBy: { createdAt: "desc" }, include: courseInclude });
        res.json(courses.map((course) => shapeCourseResponse(course)));
    }
    catch (error) {
        console.error("Error fetching public courses:", error);
        res.status(500).json({ error: "Failed to fetch courses" });
    }
});
exports.getPublicCourses = getPublicCourses;
const getCategories = (_req, res) => __awaiter(void 0, void 0, void 0, function* () { try {
    res.json((yield prisma_1.prisma.category.findMany({ orderBy: { name: "asc" } })).map((category) => category.name));
}
catch (_a) {
    res.status(500).json({ error: "Failed to fetch categories" });
} });
exports.getCategories = getCategories;
const uploadThumbnail = (req, res) => __awaiter(void 0, void 0, void 0, function* () { if (!req.file)
    return res.status(400).json({ error: "No file uploaded" }); res.json({ imageUrl: `http://localhost:5000/uploads/${req.file.filename}` }); });
exports.uploadThumbnail = uploadThumbnail;
const deleteCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const course = yield prisma_1.prisma.course.findUnique({ where: { id: req.params.courseId } });
        if (!course) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        const role = String((_a = req.user) === null || _a === void 0 ? void 0 : _a.role).toUpperCase();
        if (role !== "ADMIN" && !(role === "INSTRUCTOR" && course.instructorId === ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id))) {
            res.status(403).json({ error: "You are not authorized to delete this course" });
            return;
        }
        yield prisma_1.prisma.course.delete({ where: { id: course.id } });
        yield prisma_1.prisma.auditLog.create({ data: { actorId: (_c = req.user) === null || _c === void 0 ? void 0 : _c.id, actorRole: role, actionType: "DELETE_COURSE", resourceType: "Course", resourceId: course.id, details: { title: course.title }, ipAddress: req.ip } });
        res.json({ message: "Course deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ error: "Failed to delete course" });
    }
});
exports.deleteCourse = deleteCourse;
const updateCourseStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const status = String(req.body.status || "").toUpperCase();
        if (!["DRAFT", "REVIEW", "QA", "PUBLISHED", "ARCHIVED"].includes(status)) {
            res.status(400).json({ error: "Invalid status value" });
            return;
        }
        const course = yield prisma_1.prisma.course.findUnique({ where: { id: req.params.courseId } });
        if (!course) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        const role = String((_a = req.user) === null || _a === void 0 ? void 0 : _a.role).toUpperCase();
        if (role === "INSTRUCTOR" && course.instructorId !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            res.status(403).json({ error: "You are not authorized to update this course" });
            return;
        }
        if (role === "INSTRUCTOR" && !["DRAFT", "REVIEW"].includes(status)) {
            res.status(403).json({ error: "Instructors can only set status to DRAFT or REVIEW" });
            return;
        }
        const updated = yield prisma_1.prisma.course.update({ where: { id: course.id }, data: { status, reviewRequestedAt: status === "REVIEW" ? new Date() : null, publishAt: status === "PUBLISHED" ? (req.body.publishAt ? new Date(req.body.publishAt) : course.publishAt || new Date()) : course.publishAt }, include: courseInclude });
        yield prisma_1.prisma.auditLog.create({ data: { actorId: (_c = req.user) === null || _c === void 0 ? void 0 : _c.id, actorRole: role, actionType: "COURSE_STATUS_CHANGE", resourceType: "Course", resourceId: course.id, details: { status }, ipAddress: req.ip } });
        res.json({ message: "Course status updated", course: shapeCourseResponse(updated, 0, true) });
    }
    catch (error) {
        console.error("Error updating course status:", error);
        res.status(500).json({ error: "Failed to update course status" });
    }
});
exports.updateCourseStatus = updateCourseStatus;
const updateCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const course = yield prisma_1.prisma.course.findUnique({ where: { id: req.params.courseId } });
        if (!course) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        const role = String((_a = req.user) === null || _a === void 0 ? void 0 : _a.role).toUpperCase();
        if (role !== "ADMIN" && !(role === "INSTRUCTOR" && course.instructorId === ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id))) {
            res.status(403).json({ error: "You are not authorized to update this course" });
            return;
        }
        const { title, description, category, price, isFree, thumbnail, finalAssessment, level, duration, modules } = req.body;
        const categoryId = category === undefined ? course.categoryId : yield categoryIdFor(category);
        const updated = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            if (Array.isArray(modules)) {
                // Module/Lesson/Quiz/QuizAttempt foreign keys are all ON DELETE RESTRICT,
                // so children must be torn down bottom-up before the modules themselves
                // can be deleted, or this throws a DB constraint error whenever the
                // course already has lessons (which, until this fix, was always).
                const existingModuleIds = (yield tx.module.findMany({ where: { courseId: course.id }, select: { id: true } })).map((m) => m.id);
                if (existingModuleIds.length) {
                    const existingLessonIds = (yield tx.lesson.findMany({ where: { moduleId: { in: existingModuleIds } }, select: { id: true } })).map((l) => l.id);
                    if (existingLessonIds.length) {
                        const existingQuizIds = (yield tx.quiz.findMany({ where: { lessonId: { in: existingLessonIds } }, select: { id: true } })).map((q) => q.id);
                        if (existingQuizIds.length) {
                            yield tx.quizAttempt.deleteMany({ where: { quizId: { in: existingQuizIds } } });
                            yield tx.quiz.deleteMany({ where: { id: { in: existingQuizIds } } });
                        }
                        yield tx.lesson.deleteMany({ where: { id: { in: existingLessonIds } } });
                    }
                    yield tx.module.deleteMany({ where: { id: { in: existingModuleIds } } });
                }
            }
            return tx.course.update({ where: { id: course.id }, data: { title, description, categoryId, price: price === undefined ? undefined : Number(price), isFree, thumbnail, finalAssessment, level, duration, modules: Array.isArray(modules) ? { create: modules.map(moduleData) } : undefined }, include: courseInclude });
        }));
        res.json({ message: "Course updated successfully", course: shapeCourseResponse(updated, 0, true) });
    }
    catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({ error: "Failed to update course" });
    }
});
exports.updateCourse = updateCourse;
const getEnrolledCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () { var _a; return (0, exports.getUserCourses)(Object.assign(Object.assign({}, req), { params: { userId: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || "" } }), res); });
exports.getEnrolledCourses = getEnrolledCourses;
