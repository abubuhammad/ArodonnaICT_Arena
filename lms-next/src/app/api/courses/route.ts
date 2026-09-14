import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

const isPrivilegedForCourse = (user: any, course: any) => {
  if (!user) return false;
  const role = String(user.role || '').toUpperCase();
  if (role === 'ADMIN') return true;
  return role === 'INSTRUCTOR' && course.instructorId === user.id;
};

const shapeCourseResponse = (course: any, privileged = false) => ({
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
  modules: privileged ? course.modules || [] : sanitizeModules(course.modules || []),
  thumbnail: course.thumbnail || '/images/course-default.jpg',
  level: course.level || 'Beginner',
  duration: course.duration || '0 hours',
  progress: 0,
  finalAssessment: course.finalAssessment ? (privileged ? course.finalAssessment : { ...course.finalAssessment, questions: sanitizeQuestions(course.finalAssessment.questions) }) : null,
});

export async function GET(request: NextRequest) {
  try {
    const user = authenticateUser(request.headers);
    const { searchParams } = new URL(request.url);
    const instructor = searchParams.get('instructor');
    const status = searchParams.get('status');

    const instructorId = instructor || (user.role?.toUpperCase() === 'INSTRUCTOR' ? user.id : undefined);
    const courses = await prisma.course.findMany({
      where: {
        ...(instructorId ? { instructorId } : {}),
        ...(status ? { status: status.toUpperCase() as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: courseInclude,
    });

    return NextResponse.json(courses.map((course) => shapeCourseResponse(course, isPrivilegedForCourse(user, course))));
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number((error as any).status) || 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = authenticateUser(request.headers);
    const body = await request.json();
    const { title, description, instructor, category, price, isFree, modules = [], thumbnail, duration, level, finalAssessment } = body;
    const instructorId = instructor || user.id;

    const categoryValue = String(category || 'Uncategorized');
    const existingCategory = await prisma.category.findFirst({ where: { OR: [{ id: categoryValue }, { name: categoryValue }] } });
    const categoryId = existingCategory?.id || (await prisma.category.create({ data: { name: categoryValue } })).id;

    const course = await prisma.course.create({
      data: {
        slug: `${String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`,
        title,
        description,
        instructorId,
        categoryId,
        price: Number(price || 0),
        isFree: Boolean(isFree),
        thumbnail,
        duration: duration || '0 hours',
        level: level || 'Beginner',
        finalAssessment: finalAssessment || null,
        modules: {
          create: modules.map((module: any, index: number) => ({
            title: module.title,
            description: module.description || '',
            order: typeof module.order === 'number' ? module.order : index,
            assessment: module.assessment ?? null,
            lessons: {
              create: (Array.isArray(module.lessons) ? module.lessons : []).map((lesson: any, lessonIndex: number) => ({
                title: lesson.title,
                description: lesson.description || '',
                lessonType: lesson.lessonType || 'text-only',
                content: lesson.content || '',
                videoUrl: lesson.videoUrl || null,
                duration: lesson.duration || null,
                order: typeof lesson.order === 'number' ? lesson.order : lessonIndex,
                hasQuiz: Boolean(lesson.hasQuiz),
              })),
            },
          })),
        },
      },
      include: courseInclude,
    });

    return NextResponse.json({ message: 'Course created successfully', course: shapeCourseResponse(course, true) }, { status: 201 });
  } catch (error) {
    console.error('Course creation error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
