import { NextRequest, NextResponse } from 'next/server';
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
  (questions || []).map((question: any) => ({
    id: question.id,
    text: question.text,
    type: question.type,
    options: question.options || [],
  }));

const sanitizeModules = (modules: any[]) =>
  (modules || []).map((module: any) => ({
    ...module,
    assessment: module.assessment ? { ...module.assessment, questions: sanitizeQuestions(module.assessment.questions) } : module.assessment,
    lessons: (module.lessons || []).map((lesson: any) => ({
      ...lesson,
      quizzes: (lesson.quizzes || []).map((quiz: any) => ({
        ...quiz,
        legacyQuestions: sanitizeQuestions(Array.isArray(quiz.legacyQuestions) ? quiz.legacyQuestions : []),
      })),
    })),
  }));

const shapeCourseResponse = (course: any) => ({
  id: course.id,
  _id: course.id,
  title: course.title,
  description: course.description,
  status: course.status || 'DRAFT',
  publishAt: course.publishAt || null,
  instructor: course.instructor,
  category: course.category?.name || course.category,
  price: course.price,
  enrolledStudents: course.enrolledStudents || [],
  isFree: course.isFree,
  modules: sanitizeModules(course.modules || []),
  thumbnail: normalizeThumbnail(course.thumbnail),
  level: course.level || 'Beginner',
  duration: course.duration || '0 hours',
  progress: 0,
  finalAssessment: course.finalAssessment ? { ...course.finalAssessment, questions: sanitizeQuestions(course.finalAssessment.questions) } : null,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const courses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
        ...(category ? { category: { name: category } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: courseInclude,
    });

    return NextResponse.json(courses.map((course) => shapeCourseResponse(course)));
  } catch (error) {
    console.error('Error fetching public courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
