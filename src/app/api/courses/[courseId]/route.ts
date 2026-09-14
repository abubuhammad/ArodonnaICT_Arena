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
