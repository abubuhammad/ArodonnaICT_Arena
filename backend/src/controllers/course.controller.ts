import { Request, Response } from "express";
import axios from "axios";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth";
import { sanitizeQuestions } from "../services/courseProgressService";
import { parseCourseMarkdown } from "../services/courseMarkdownParser";

const courseInclude = {
  instructor: { select: { id: true, name: true, title: true, avatar: true, isAvailableForCall: true, locale: true, currency: true } },
  category: true,
  modules: {
    orderBy: { order: "asc" as const },
    include: { lessons: { orderBy: { order: "asc" as const }, include: { quizzes: true } } },
  },
};

const categoryIdFor = async (category: unknown) => {
  const value = String(category || "Uncategorized");
  const existing = await prisma.category.findFirst({ where: { OR: [{ id: value }, { name: value }] } });
  return existing?.id || (await prisma.category.create({ data: { name: value } })).id;
};

const validateCoursePayload = (payload: any): string | null => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "Course payload must be a JSON object";
  if (!String(payload.title || "").trim()) return "Course title is required";
  if (!String(payload.description || "").trim()) return "Course description is required";
  if (!String(payload.category || "").trim()) return "Course category is required";
  if (!String(payload.thumbnail || "").trim()) return "Course thumbnail is required";
  if (!Array.isArray(payload.modules) || payload.modules.length === 0) return "At least one course module is required";
  for (const [moduleIndex, module] of payload.modules.entries()) {
    if (!module || !String(module.title || "").trim() || !String(module.description || "").trim()) return `Module ${moduleIndex + 1} needs a title and description`;
    if (!Array.isArray(module.lessons) || module.lessons.length === 0) return `Module ${moduleIndex + 1} needs at least one lesson`;
    for (const [lessonIndex, lesson] of module.lessons.entries()) {
      if (!lesson || !String(lesson.title || "").trim() || !String(lesson.description || "").trim() || !String(lesson.content || "").trim()) return `Module ${moduleIndex + 1}, lesson ${lessonIndex + 1} needs a title, description, and content`;
    }
  }
  if (payload.price !== undefined && (!Number.isFinite(Number(payload.price)) || Number(payload.price) < 0)) return "Course price must be a non-negative number";
  if (payload.finalAssessment !== undefined && payload.finalAssessment !== null) {
    const assessment = payload.finalAssessment;
    if (!assessment || !String(assessment.title || "").trim() || !String(assessment.description || "").trim() || Number(assessment.timeLimit) <= 0 || Number(assessment.passingScore) < 0 || Number(assessment.passingScore) > 100) return "Final assessment details are invalid";
    if (!Array.isArray(assessment.questions) || assessment.questions.length === 0 || assessment.questions.some((question: any) => !question || !String(question.question || "").trim() || !Array.isArray(question.options) || question.options.filter((option: any) => String(option || "").trim()).length < 2 || !String(question.correctAnswer || "").trim() || !question.options.includes(question.correctAnswer))) return "Every final assessment needs at least one question with two options and a matching correct answer";
  }
  return null;
};

/** Is this requester allowed to see answer keys for this course (quiz answers,
 * module/final assessment answers)? Only the owning instructor or an admin. */
const isPrivilegedForCourse = (user: AuthRequest["user"], course: any) => {
  if (!user) return false;
  const role = String(user.role || "").toUpperCase();
  if (role === "ADMIN") return true;
  return role === "INSTRUCTOR" && course.instructorId === user.id;
};

/** Strips answer keys from a lesson's quizzes and a module's/course's assessment
 * JSON before sending to a non-privileged viewer (student, public browsing). */
const sanitizeModules = (modules: any[]) =>
  (modules || []).map((module: any) => ({
    ...module,
    assessment: module.assessment
      ? { ...module.assessment, questions: sanitizeQuestions(module.assessment.questions) }
      : module.assessment,
    lessons: (module.lessons || []).map((lesson: any) => ({
      ...lesson,
      quizzes: (lesson.quizzes || []).map((quiz: any) => ({
        ...quiz,
        legacyQuestions: sanitizeQuestions(Array.isArray(quiz.legacyQuestions) ? quiz.legacyQuestions : []),
      })),
    })),
  }));

const shapeCourseResponse = (course: any, progress = 0, privileged = false) => ({
  id: course.id,
  _id: course.id,
  title: course.title,
  description: course.description,
  status: course.status || "DRAFT",
  publishAt: course.publishAt || null,
  instructor: course.instructor,
  category: course.category?.name || course.category,
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
      : { ...course.finalAssessment, questions: sanitizeQuestions(course.finalAssessment.questions) }
    : null,
});

/** Maps the instructor course-builder's per-lesson quiz fields (a single
 * quizQuestion/quizOptions/correctAnswer, kept for UI backwards-compatibility)
 * plus an optional richer `quiz.questions[]` array into a real nested Quiz
 * create, so answers are actually persisted instead of silently dropped. */
const lessonQuizCreate = (lesson: any) => {
  const questions: any[] = [];
  if (Array.isArray(lesson.quiz?.questions) && lesson.quiz.questions.length) {
    for (const q of lesson.quiz.questions) {
      if (!q?.text && !q?.quizQuestion) continue;
      questions.push({
        text: q.text || q.quizQuestion,
        options: Array.isArray(q.options) ? q.options : Array.isArray(q.quizOptions) ? q.quizOptions : [],
        correctAnswer: q.correctAnswer ?? q.correct ?? q.answer,
      });
    }
  } else if (lesson.quizQuestion) {
    questions.push({
      text: lesson.quizQuestion,
      options: Array.isArray(lesson.quizOptions) ? lesson.quizOptions : [],
      correctAnswer: lesson.correctAnswer,
    });
  }
  if (!questions.length) return undefined;
  return {
    create: [{
      title: lesson.quiz?.title || `${lesson.title || "Lesson"} Quiz`,
      passingScore: Number(lesson.quiz?.passingScore ?? 100),
      attemptsAllowed: Number(lesson.quiz?.attemptsAllowed ?? 3),
      gradingMode: lesson.quiz?.gradingMode || "auto",
      legacyQuestions: questions,
    }],
  };
};

const moduleData = (module: any, index: number) => ({
  title: module.title,
  description: module.description || "",
  order: typeof module.order === "number" ? module.order : index,
  assessment: module.assessment ?? null,
  lessons: { create: Array.isArray(module.lessons) ? module.lessons.map((lesson: any, lessonIndex: number) => {
    const quizzes = lessonQuizCreate(lesson);
    return {
      title: lesson.title,
      description: lesson.description || "",
      lessonType: lesson.lessonType || "text-only",
      content: lesson.content || "",
      videoUrl: lesson.videoUrl || null,
      duration: lesson.duration || null,
      order: typeof lesson.order === "number" ? lesson.order : lessonIndex,
      hasQuiz: Boolean(lesson.hasQuiz) || Boolean(quizzes),
      ...(quizzes ? { quizzes } : {}),
    };
  }) : [] },
});

export const createCourse = async (req: Request, res: Response) => {
  try {
    const validationError = validateCoursePayload(req.body);
    if (validationError) return res.status(400).json({ error: validationError });
    const { title, description, instructor, category, price, isFree, modules = [], thumbnail, duration, level, finalAssessment } = req.body;
    const instructorId = instructor || (req as AuthRequest).user?.id;
    if (!instructorId) return res.status(400).json({ error: "Instructor is required" });
    const categoryId = await categoryIdFor(category);
    const course = await prisma.course.create({
      data: { slug: `${String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`, title, description, instructorId, categoryId, price: Number(price || 0), isFree: Boolean(isFree), thumbnail, duration: duration || "0 hours", level: level || "Beginner", finalAssessment: finalAssessment || null, modules: { create: modules.map(moduleData) } },
      include: courseInclude,
    });
    res.status(201).json({ message: "Course created successfully", course: shapeCourseResponse(course, 0, true) });
  } catch (error) { console.error("Course creation error:", error); res.status(500).json({ error: "Failed to create course" }); }
};

export const importCourse = createCourse;

export const importMarkdownCourse = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "A Markdown course file is required" });
    const markdown = req.file.buffer.toString("utf8");
    req.body = parseCourseMarkdown(markdown);
    return createCourse(req, res);
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || "Invalid Markdown course template" });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId }, include: courseInclude });
    if (!course) return res.status(404).json({ error: "Course not found" });
    const privileged = isPrivilegedForCourse((req as AuthRequest).user, course);
    res.json(shapeCourseResponse(course, 0, privileged));
  } catch (error) { console.error("Error fetching course:", error); res.status(500).json({ error: "Failed to fetch course details" }); }
};

export const getPublicCourseById = async (req: Request, res: Response) => {
  try {
    const course = await prisma.course.findFirst({
      where: {
        id: req.params.courseId,
        status: "PUBLISHED",
        OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
      },
      include: courseInclude,
    });
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(shapeCourseResponse(course));
  } catch (error) { console.error("Error fetching public course:", error); res.status(500).json({ error: "Failed to fetch course details" }); }
};

export const getCourses = async (req: AuthRequest, res: Response) => {
  try {
    const { instructor, status } = req.query as { instructor?: string; status?: string };
    const instructorId = instructor || (req.user?.role?.toUpperCase() === "INSTRUCTOR" ? req.user.id : undefined);
    const courses = await prisma.course.findMany({ where: { instructorId, status: status?.toUpperCase() as any }, orderBy: { createdAt: "desc" }, include: courseInclude });
    res.json(courses.map((course) => shapeCourseResponse(course, 0, isPrivilegedForCourse(req.user, course))));
  } catch (error) { console.error("Error fetching courses:", error); res.status(500).json({ error: "Failed to fetch courses" }); }
};

export const enrollInCourse = async (req: Request, res: Response) => {
  try {
    const { courseId, reference, paymentMethod } = req.body;
    const userId = (req as AuthRequest).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (course.instructorId === userId) return res.status(400).json({ error: "Cannot enroll in your own course" });
    if (await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } })) return res.status(400).json({ error: "Already enrolled in this course" });
    if (course.isFree) { await prisma.enrollment.create({ data: { userId, courseId, paymentStatus: "WAIVED" } }); return res.json({ message: "Successfully enrolled in free course" }); }
    if (!reference) return res.status(400).json({ error: "Payment reference required" });
    const secret = process.env.PAYSTACK_SECRET;
    if (!secret) return res.status(500).json({ error: "PAYSTACK_SECRET is not configured" });
    const verified = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, { headers: { Authorization: `Bearer ${secret}` } });
    if (verified.data?.data?.status !== "success") return res.status(400).json({ error: "Payment verification failed" });
    await prisma.enrollment.create({ data: { userId, courseId, paymentStatus: "PAID", paymentMethod: String(paymentMethod || "PAYSTACK").toUpperCase() as any, paymentReference: reference, amountPaid: Number(verified.data.data.amount || 0) } });
    res.json({ message: "Payment verified and enrollment successful", amountPaid: Number(verified.data.data.amount || 0) });
  } catch (error) { console.error("Enroll error:", error); res.status(500).json({ error: "Enrollment process failed" }); }
};

export const getUserCourses = async (req: Request, res: Response) => {
  try {
    const enrollments = await prisma.enrollment.findMany({ where: { userId: req.params.userId }, include: { course: { include: { instructor: { select: { name: true } }, category: true } } } });
    res.json(enrollments.map((e) => ({ id: e.course.id, title: e.course.title, description: e.course.description, instructor: e.course.instructor.name, thumbnail: e.course.thumbnail || "/images/course-default.jpg", price: e.course.price, isFree: e.course.isFree, level: e.course.level || "Beginner", duration: e.course.duration || "0 hours", category: e.course.category.name, progress: e.progressPercentage })));
  } catch { res.status(500).json({ error: "Unable to fetch enrolled courses" }); }
};

export const getCourseModules = async (req: Request, res: Response) => {
  try { res.json(await prisma.module.findMany({ where: { courseId: req.params.courseId }, orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } })); }
  catch { res.status(500).json({ error: "Failed to fetch course modules" }); }
};

export const getPublicCourses = async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({ where: { status: "PUBLISHED", OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }], category: req.query.category ? { name: String(req.query.category) } : undefined }, orderBy: { createdAt: "desc" }, include: courseInclude });
    res.json(courses.map((course) => shapeCourseResponse(course)));
  } catch (error) { console.error("Error fetching public courses:", error); res.status(500).json({ error: "Failed to fetch courses" }); }
};

export const getCategories = async (_req: AuthRequest, res: Response) => { try { res.json((await prisma.category.findMany({ orderBy: { name: "asc" } })).map((category) => category.name)); } catch { res.status(500).json({ error: "Failed to fetch categories" }); } };
export const uploadThumbnail = async (req: Request, res: Response) => { if (!req.file) return res.status(400).json({ error: "No file uploaded" }); res.json({ imageUrl: `http://localhost:5000/uploads/${req.file.filename}` }); };

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    if (!course) { res.status(404).json({ error: "Course not found" }); return; }
    const role = String(req.user?.role).toUpperCase();
    if (role !== "ADMIN" && !(role === "INSTRUCTOR" && course.instructorId === req.user?.id)) { res.status(403).json({ error: "You are not authorized to delete this course" }); return; }
    await prisma.course.delete({ where: { id: course.id } });
    await prisma.auditLog.create({ data: { actorId: req.user?.id, actorRole: role, actionType: "DELETE_COURSE", resourceType: "Course", resourceId: course.id, details: { title: course.title }, ipAddress: req.ip } });
    res.json({ message: "Course deleted successfully" });
  } catch (error) { console.error("Error deleting course:", error); res.status(500).json({ error: "Failed to delete course" }); }
};

export const updateCourseStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = String(req.body.status || "").toUpperCase() as any;
    if (!["DRAFT", "REVIEW", "QA", "PUBLISHED", "ARCHIVED"].includes(status)) { res.status(400).json({ error: "Invalid status value" }); return; }
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    if (!course) { res.status(404).json({ error: "Course not found" }); return; }
    const role = String(req.user?.role).toUpperCase();
    if (role === "INSTRUCTOR" && course.instructorId !== req.user?.id) { res.status(403).json({ error: "You are not authorized to update this course" }); return; }
    if (role === "INSTRUCTOR" && !["DRAFT", "REVIEW"].includes(status)) { res.status(403).json({ error: "Instructors can only set status to DRAFT or REVIEW" }); return; }
    const updated = await prisma.course.update({ where: { id: course.id }, data: { status, reviewRequestedAt: status === "REVIEW" ? new Date() : null, publishAt: status === "PUBLISHED" ? (req.body.publishAt ? new Date(req.body.publishAt) : course.publishAt || new Date()) : course.publishAt }, include: courseInclude });
    await prisma.auditLog.create({ data: { actorId: req.user?.id, actorRole: role, actionType: "COURSE_STATUS_CHANGE", resourceType: "Course", resourceId: course.id, details: { status }, ipAddress: req.ip } });
    res.json({ message: "Course status updated", course: shapeCourseResponse(updated, 0, true) });
  } catch (error) { console.error("Error updating course status:", error); res.status(500).json({ error: "Failed to update course status" }); }
};

export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    if (!course) { res.status(404).json({ error: "Course not found" }); return; }
    const role = String(req.user?.role).toUpperCase();
    const isAdminRole = ["ADMIN", "SUPER_ADMIN", "ORG_ADMIN", "COURSE_ADMIN"].includes(role);
    if (!isAdminRole && !(role === "INSTRUCTOR" && course.instructorId === req.user?.id)) { res.status(403).json({ error: "You are not authorized to update this course" }); return; }
    const { title, description, category, price, isFree, thumbnail, finalAssessment, level, duration, modules } = req.body;
    const categoryId = category === undefined ? course.categoryId : await categoryIdFor(category);
    const currentThumbnail = typeof course.thumbnail === "string" && /^\[.*\]$/.test(course.thumbnail.trim())
      ? "/images/course-default.jpg"
      : course.thumbnail;
    const nextThumbnail = typeof thumbnail === "string" && /^\[.*\]$/.test(thumbnail.trim())
      ? currentThumbnail
      : (thumbnail === "" || thumbnail === undefined ? currentThumbnail : thumbnail);
    const updated = await prisma.$transaction(async (tx) => {
      if (Array.isArray(modules)) {
        // Module/Lesson/Quiz/QuizAttempt foreign keys are all ON DELETE RESTRICT,
        // so children must be torn down bottom-up before the modules themselves
        // can be deleted, or this throws a DB constraint error whenever the
        // course already has lessons (which, until this fix, was always).
        const existingModuleIds = (await tx.module.findMany({ where: { courseId: course.id }, select: { id: true } })).map((m) => m.id);
        if (existingModuleIds.length) {
          const existingLessonIds = (await tx.lesson.findMany({ where: { moduleId: { in: existingModuleIds } }, select: { id: true } })).map((l) => l.id);
          if (existingLessonIds.length) {
            const existingQuizIds = (await tx.quiz.findMany({ where: { lessonId: { in: existingLessonIds } }, select: { id: true } })).map((q) => q.id);
            if (existingQuizIds.length) {
              await tx.quizAttempt.deleteMany({ where: { quizId: { in: existingQuizIds } } });
              await tx.quiz.deleteMany({ where: { id: { in: existingQuizIds } } });
            }
            await tx.lesson.deleteMany({ where: { id: { in: existingLessonIds } } });
          }
          await tx.module.deleteMany({ where: { id: { in: existingModuleIds } } });
        }
      }
      return tx.course.update({ where: { id: course.id }, data: { title, description, categoryId, price: price === undefined ? undefined : Number(price), isFree, thumbnail: nextThumbnail, finalAssessment, level, duration, modules: Array.isArray(modules) ? { create: modules.map(moduleData) } : undefined }, include: courseInclude });
    }, { maxWait: 10000, timeout: 30000 });
    res.json({ message: "Course updated successfully", course: shapeCourseResponse(updated, 0, true) });
  } catch (error: any) {
    console.error("Error updating course:", error);
    const detail = error?.code ? `${error.code}: ${error.message}` : error?.message;
    res.status(500).json({ error: detail || "Failed to update course" });
  }
};

export const getEnrolledCourses = async (req: AuthRequest, res: Response) => getUserCourses({ ...req, params: { userId: req.user?.id || "" } } as unknown as Request, res);
