import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeThumbnail } from '@/lib/thumbnail';

const courseInclude = {
  instructor: { select: { id: true, name: true, title: true, avatar: true, isAvailableForCall: true, locale: true, currency: true } },
  category: true,
  modules: {
    orderBy: { order: 'asc' as const },
    include: { lessons: { orderBy: { order: 'asc' as const }, include: { quizzes: true } } },
  },
};

const sanitizeQuestions = (questions: any[] = []) =>
  questions.map((question: any) => ({
    id: question.id,
    text: question.text,
    type: question.type,
    options: question.options || [],
  }));

const sanitizeModules = (modules: any[]) =>
  modules.map((module: any) => ({
    ...module,
    assessment: module.assessment
      ? { ...module.assessment, questions: sanitizeQuestions(module.assessment.questions || []) }
      : module.assessment,
    lessons: (module.lessons || []).map((lesson: any) => ({
      ...lesson,
      quizzes: (lesson.quizzes || []).map((quiz: any) => ({
        ...quiz,
        legacyQuestions: sanitizeQuestions(Array.isArray(quiz.legacyQuestions) ? quiz.legacyQuestions : []),
      })),
    })),
  }));

const categoryIdFor = async (category: unknown) => {
  const value = String(category || 'Uncategorized');
  const existing = await prisma.category.findFirst({ where: { OR: [{ id: value }, { name: value }] } });
  return existing?.id || (await prisma.category.create({ data: { name: value } })).id;
};

const moduleCreateData = (module: any, index: number) => ({
  title: module.title,
  description: module.description || '',
  order: typeof module.order === 'number' ? module.order : index,
  assessment: module.assessment ?? null,
  lessons: {
    create: Array.isArray(module.lessons)
      ? module.lessons.map((lesson: any, lessonIndex: number) => ({
          title: lesson.title,
          description: lesson.description || '',
          lessonType: lesson.lessonType || 'text-only',
          content: lesson.content || '',
          videoUrl: lesson.videoUrl || null,
          duration: lesson.duration || null,
          order: typeof lesson.order === 'number' ? lesson.order : lessonIndex,
          hasQuiz: Boolean(lesson.hasQuiz),
        }))
      : [],
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = authenticateUser(request.headers);
    const { courseId } = await params;
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: courseInclude,
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const role = String(user.role || '').toUpperCase();
    const privileged = role === 'ADMIN' || (role === 'INSTRUCTOR' && course.instructorId === user.id);
    return NextResponse.json({
      id: course.id,
      _id: course.id,
      title: course.title,
      description: course.description,
      status: course.status,
      publishAt: course.publishAt,
      instructor: course.instructor,
      category: course.category?.name || course.category,
      price: course.price,
      enrolledStudents: course.enrolledStudents || [],
      isFree: course.isFree,
      modules: privileged ? course.modules : sanitizeModules(course.modules || []),
      thumbnail: normalizeThumbnail(course.thumbnail),
      level: course.level || 'Beginner',
      duration: course.duration || '0 hours',
      progress: 0,
      finalAssessment: course.finalAssessment
        ? privileged
          ? course.finalAssessment
          : { ...(course.finalAssessment as any), questions: sanitizeQuestions((course.finalAssessment as any).questions || []) }
        : null,
    });
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    }
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Failed to fetch course details' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = authenticateUser(request.headers);
    const { courseId } = await params;
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const role = String(user.role || '').toUpperCase();
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN', 'COURSE_ADMIN'].includes(role);
    if (!isAdmin && !(role === 'INSTRUCTOR' && course.instructorId === user.id)) {
      return NextResponse.json({ error: 'You are not authorized to update this course' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, category, price, isFree, thumbnail, finalAssessment, level, duration, modules } = body;
    const categoryId = category === undefined ? course.categoryId : await categoryIdFor(category);
    const updated = await prisma.$transaction(async (transaction) => {
      if (Array.isArray(modules)) {
        const moduleIds = (await transaction.module.findMany({ where: { courseId }, select: { id: true } })).map((module) => module.id);
        if (moduleIds.length) {
          const lessonIds = (await transaction.lesson.findMany({ where: { moduleId: { in: moduleIds } }, select: { id: true } })).map((lesson) => lesson.id);
          if (lessonIds.length) {
            const quizIds = (await transaction.quiz.findMany({ where: { lessonId: { in: lessonIds } }, select: { id: true } })).map((quiz) => quiz.id);
            if (quizIds.length) {
              await transaction.quizAttempt.deleteMany({ where: { quizId: { in: quizIds } } });
              await transaction.quiz.deleteMany({ where: { id: { in: quizIds } } });
            }
            await transaction.lesson.deleteMany({ where: { id: { in: lessonIds } } });
          }
          await transaction.module.deleteMany({ where: { id: { in: moduleIds } } });
        }
      }

      return transaction.course.update({
        where: { id: courseId },
        data: {
          title,
          description,
          categoryId,
          price: price === undefined ? undefined : Number(price),
          isFree,
          thumbnail: thumbnail || course.thumbnail,
          finalAssessment,
          level,
          duration,
          modules: Array.isArray(modules) ? { create: modules.map(moduleCreateData) } : undefined,
        },
        include: courseInclude,
      });
    }, { maxWait: 10000, timeout: 30000 });

    return NextResponse.json({ message: 'Course updated successfully', course: updated });
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number(error.status) || 401 });
    }
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}
