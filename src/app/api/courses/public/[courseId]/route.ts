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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        status: 'PUBLISHED',
        OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
      },
      include: courseInclude,
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(shapeCourseResponse(course));
  } catch (error) {
    console.error('Error fetching public course:', error);
    return NextResponse.json({ error: 'Failed to fetch course details' }, { status: 500 });
  }
}
