import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { getCached, setCached, clearCache } from '@/lib/metricsCache';
import { normalizeThumbnail } from '@/lib/thumbnail';

const baseCertificateUrl = () => process.env.CERTIFICATE_BASE_URL || 'http://localhost:5000/api/certificates';
const ipOf = (request: Request) => request.headers.get('x-forwarded-for') || undefined;

export async function registerAdmin(body: any) {
  if (await prisma.user.count({ where: { role: 'ADMIN' } })) {
    if (!process.env.ADMIN_SETUP_TOKEN || body.setupToken !== process.env.ADMIN_SETUP_TOKEN) throw Object.assign(new Error('Admin creation locked. Provide valid X-Setup-Token.'), { status: 403 });
  }
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) throw Object.assign(new Error('Admin already exists'), { status: 400 });
  await prisma.user.create({ data: { name: body.name, email: body.email, password: await bcrypt.hash(body.password, 10), role: 'ADMIN' } });
  return { message: 'Admin created successfully' };
}

export async function adminLogin(body: any) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  const admin = await prisma.user.findFirst({ where: { email, role: 'ADMIN' } });
  if (!admin || !(await bcrypt.compare(password, admin.password))) throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  if (!process.env.JWT_SECRET) throw Object.assign(new Error('Server configuration error'), { status: 500 });
  return { message: 'Admin login successful', token: jwt.sign({ id: admin.id, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '1d' }), admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } };
}

export async function getUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, role: true, title: true, avatar: true, bio: true, isAvailableForCall: true, expertise: true, socialLinks: true, createdAt: true } });
}

export async function getEnrollments() {
  const items = await prisma.enrollment.findMany({ orderBy: { createdAt: 'desc' }, include: { course: { select: { id: true, title: true } }, user: { select: { id: true, name: true, email: true } } } });
  return items.map((item) => ({ id: item.id, status: item.status, paymentStatus: item.paymentStatus, paymentMethod: item.paymentMethod, paymentReference: item.paymentReference, progressPercentage: item.progressPercentage, enrolledAt: item.enrolledAt, createdAt: item.createdAt, course: item.course, user: item.user }));
}

export async function deleteEnrollment(id: string) { await prisma.enrollment.delete({ where: { id } }); return { message: 'Enrollment deleted successfully' }; }
export async function grantFreeEnrollment(id: string) { return prisma.enrollment.update({ where: { id }, data: { paymentStatus: 'WAIVED' } }); }
export async function adminGrantFreeEnrollment(body: any) { const enrollment = await prisma.enrollment.upsert({ where: { userId_courseId: { userId: body.userId, courseId: body.courseId } }, update: { paymentStatus: 'WAIVED', status: 'ENROLLED' }, create: { userId: body.userId, courseId: body.courseId, paymentStatus: 'WAIVED' } }); return { message: 'Free enrollment granted', enrollment }; }
export async function verifyPayment(id: string, verified: boolean) { const enrollment = await prisma.enrollment.update({ where: { id }, data: { paymentStatus: verified ? 'PAID' : 'NOT_PAID', status: verified ? 'ENROLLED' : undefined } }); return { message: `Payment ${verified ? 'verified' : 'rejected'} successfully`, enrollment }; }
export async function verifyEnrollmentPayment(id: string, verified: boolean) { const enrollment = await prisma.enrollment.update({ where: { id }, data: { paymentStatus: verified ? 'PAID' : 'NOT_PAID', status: 'ENROLLED' } }); return { message: 'Payment status updated', enrollment }; }

export async function approveInstructor(id: string) { const user = await prisma.user.findUnique({ where: { id } }); if (!user) throw Object.assign(new Error('User not found'), { status: 404 }); if (user.role !== 'PENDING') throw Object.assign(new Error('User is not pending instructor approval'), { status: 400 }); const updated = await prisma.user.update({ where: { id }, data: { role: 'INSTRUCTOR' } }); return { message: 'Instructor approved successfully', user: updated }; }
export async function deleteUser(id: string, actor: any, request: Request) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  await prisma.$transaction(async (tx) => {
    const [enrollments, courses] = await Promise.all([
      tx.enrollment.findMany({ where: { userId: id }, select: { id: true } }),
      tx.course.findMany({ where: { instructorId: id }, select: { id: true } }),
    ]);
    const enrollmentIds = enrollments.map((enrollment) => enrollment.id);
    const courseIds = courses.map((course) => course.id);
    const moduleIds = courseIds.length
      ? (await tx.module.findMany({ where: { courseId: { in: courseIds } }, select: { id: true } })).map((module) => module.id)
      : [];
    const lessonIds = moduleIds.length
      ? (await tx.lesson.findMany({ where: { moduleId: { in: moduleIds } }, select: { id: true } })).map((lesson) => lesson.id)
      : [];
    const quizIds = lessonIds.length
      ? (await tx.quiz.findMany({ where: { lessonId: { in: lessonIds } }, select: { id: true } })).map((quiz) => quiz.id)
      : [];
    const quizAttemptFilters = [
      { userId: id },
      { gradedById: id },
      ...(enrollmentIds.length ? [{ enrollmentId: { in: enrollmentIds } }] : []),
      ...(quizIds.length ? [{ quizId: { in: quizIds } }] : []),
    ];

    await tx.quizAttempt.deleteMany({ where: { OR: quizAttemptFilters } });
    if (enrollmentIds.length) {
      await tx.certificate.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
      await tx.courseProgress.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
      await tx.enrollment.deleteMany({ where: { id: { in: enrollmentIds } } });
    }
    if (quizIds.length) await tx.quiz.deleteMany({ where: { id: { in: quizIds } } });
    if (lessonIds.length) await tx.lesson.deleteMany({ where: { id: { in: lessonIds } } });
    if (moduleIds.length) await tx.module.deleteMany({ where: { id: { in: moduleIds } } });
    if (courseIds.length) await tx.course.deleteMany({ where: { id: { in: courseIds } } });

    await tx.user.delete({ where: { id } });
  });

  await prisma.auditLog.create({ data: { actorId: actor.id, actorRole: actor.role, actionType: 'DELETE_USER', resourceType: 'User', resourceId: user.id, details: { email: user.email, name: user.name }, ipAddress: ipOf(request) } });
  return { message: 'User deleted successfully' };
}

export async function getLearnerProfile(userId: string) { const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, createdAt: true } }); if (!user) throw Object.assign(new Error('User not found'), { status: 404 }); const enrollments = await prisma.enrollment.findMany({ where: { userId: user.id }, include: { course: { select: { title: true } } } }); const completed = enrollments.filter((item) => item.status === 'COMPLETED'); return { _id: user.id, ...user, enrollments: enrollments.map((item) => ({ _id: item.id, courseId: item.courseId, courseName: item.course.title, status: item.status, progress: item.progressPercentage, enrolledAt: item.enrolledAt, certificate: item.certificate })), totalEnrollments: enrollments.length, completedCourses: completed.length, certificatesIssued: completed.filter((item) => item.certificate).length, averageProgress: enrollments.length ? Math.round(enrollments.reduce((sum, item) => sum + item.progressPercentage, 0) / enrollments.length) : 0 }; }

const courseInclude = { instructor: { select: { id: true, name: true, title: true, avatar: true, isAvailableForCall: true, locale: true, currency: true } }, category: true, modules: { orderBy: { order: 'asc' as const }, include: { lessons: { orderBy: { order: 'asc' as const }, include: { quizzes: true } } } } };
const shapeCourse = (course: any) => ({ id: course.id, _id: course.id, title: course.title, description: course.description, status: course.status || 'DRAFT', publishAt: course.publishAt || null, instructor: course.instructor, category: course.category?.name || course.category, price: course.price, enrolledStudents: course.enrolledStudents || [], isFree: course.isFree, modules: course.modules || [], thumbnail: normalizeThumbnail(course.thumbnail), level: course.level || 'Beginner', duration: course.duration || '0 hours', progress: 0, finalAssessment: course.finalAssessment || null });
export async function getCourses(query: URLSearchParams) { const instructor = query.get('instructor') || undefined; const status = query.get('status') || undefined; const courses = await prisma.course.findMany({ where: { ...(instructor ? { instructorId: instructor } : {}), ...(status ? { status: status.toUpperCase() as any } : {}) }, orderBy: { createdAt: 'desc' }, include: courseInclude }); return courses.map(shapeCourse); }
export async function updateCourseStatus(courseId: string, body: any, actor: any, request: Request) { const status = String(body.status || '').toUpperCase(); if (!['DRAFT', 'REVIEW', 'QA', 'PUBLISHED', 'ARCHIVED'].includes(status)) throw Object.assign(new Error('Invalid status value'), { status: 400 }); const course = await prisma.course.findUnique({ where: { id: courseId } }); if (!course) throw Object.assign(new Error('Course not found'), { status: 404 }); const role = String(actor.role).toUpperCase(); if (role === 'INSTRUCTOR' && course.instructorId !== actor.id) throw Object.assign(new Error('You are not authorized to update this course'), { status: 403 }); if (role === 'INSTRUCTOR' && !['DRAFT', 'REVIEW'].includes(status)) throw Object.assign(new Error('Instructors can only set status to DRAFT or REVIEW'), { status: 403 }); const updated = await prisma.course.update({ where: { id: courseId }, data: { status: status as any, reviewRequestedAt: status === 'REVIEW' ? new Date() : null, publishAt: status === 'PUBLISHED' ? (body.publishAt ? new Date(body.publishAt) : course.publishAt || new Date()) : course.publishAt }, include: courseInclude }); await prisma.auditLog.create({ data: { actorId: actor.id, actorRole: role, actionType: 'COURSE_STATUS_CHANGE', resourceType: 'Course', resourceId: courseId, details: { status }, ipAddress: ipOf(request) } }); return { message: 'Course status updated', course: shapeCourse(updated) }; }

const enrollmentsFor = (tenantId?: string, since?: Date) => prisma.enrollment.findMany({ where: { tenantId, enrolledAt: since ? { gte: since } : undefined }, include: { course: { select: { title: true } } }, orderBy: { enrolledAt: 'asc' } });
export async function metricsOverview(query: URLSearchParams) { const days = Number(query.get('days')) || 7; const tenantId = query.get('tenantId') || undefined; const key = `admin:metrics:overview:days=${days}:tenant=${tenantId || '__all'}`; const cached = await getCached(key); if (cached) return cached; const since = new Date(Date.now() - days * 86400000); const enrollments = await prisma.enrollment.findMany({ where: { tenantId, enrolledAt: { gte: since } }, include: { course: true } }); const all = await prisma.enrollment.findMany({ where: { tenantId } }); const result = { activeLearners: { value: new Set(enrollments.map((item) => item.userId)).size, change: '—' }, newEnrollments: { value: enrollments.length, change: '—' }, completions: { value: `${all.length ? Math.round(all.filter((item) => item.status === 'COMPLETED').length / all.length * 100) : 0}%`, change: '—' }, revenue: { value: `$${enrollments.filter((item) => item.paymentStatus === 'PAID').reduce((sum, item) => sum + Number(item.amountPaid || item.course.price), 0).toFixed(2)}`, change: '—' } }; await setCached(key, result, 120); return result; }
export async function analytics(query: URLSearchParams) { const days = Math.min(Math.max(Number(query.get('days')) || 30, 1), 90); const tenantId = query.get('tenantId') || undefined; const rows = await enrollmentsFor(tenantId, new Date(Date.now() - days * 86400000)); const byDate = new Map<string, number>(); const byCourse = new Map<string, { title: string; total: number; completed: number }>(); for (const row of rows) { const date = row.enrolledAt.toISOString().slice(0, 10); byDate.set(date, (byDate.get(date) || 0) + 1); const current = byCourse.get(row.courseId) || { title: row.course.title, total: 0, completed: 0 }; current.total++; if (row.status === 'COMPLETED') current.completed++; byCourse.set(row.courseId, current); } let cumulative = 0; const enrollmentTrend = [...byDate].map(([date, count]) => { cumulative += count; return { date, count, cumulative }; }); const completionRates = [...byCourse].map(([courseId, value]) => ({ courseId, courseName: value.title, totalEnrollments: value.total, completedEnrollments: value.completed, completionRate: value.total ? value.completed / value.total * 100 : 0 })).sort((a, b) => b.completionRate - a.completionRate); const all = await prisma.enrollment.findMany({ where: { tenantId } }); const totalCompleted = all.filter((row) => row.status === 'COMPLETED').length; return { enrollmentTrend, completionRates, totalEnrollments: all.length, totalCompleted, overallCompletionRate: all.length ? totalCompleted / all.length * 100 : 0 }; }
export async function funnels(query: URLSearchParams) { const key = `admin:analytics:funnels:${query.get('days') || 30}:${query.get('tenantId') || 'all'}`; const cached = await getCached(key); if (cached) return cached; const rows = await enrollmentsFor(query.get('tenantId') || undefined, new Date(Date.now() - (Number(query.get('days')) || 30) * 86400000)); const result = { enrolled: rows.length, started: rows.filter((row) => row.progressPercentage > 0).length, paid: rows.filter((row) => ['PAID', 'WAIVED'].includes(row.paymentStatus)).length, completed: rows.filter((row) => row.status === 'COMPLETED').length }; await setCached(key, result, 120); return result; }
export async function cohorts(query: URLSearchParams) { const weeks = Math.min(Math.max(Number(query.get('weeks')) || 8, 1), 52); const rows = await enrollmentsFor(query.get('tenantId') || undefined, new Date(Date.now() - weeks * 7 * 86400000)); const cohorts = new Map<string, any>(); for (const row of rows) { const start = new Date(row.enrolledAt); start.setDate(start.getDate() - start.getDay()); const key = start.toISOString().slice(0, 10); const cohort = cohorts.get(key) || { cohortStart: key, totalEnrolled: 0, completedWithin1Week: 0, completedWithin2Weeks: 0, completedWithin4Weeks: 0, completedWithin8Weeks: 0 }; cohort.totalEnrolled++; if (row.status === 'COMPLETED') { const elapsed = (row.updatedAt.getTime() - row.enrolledAt.getTime()) / 86400000; for (const [limit, field] of [[7, 'completedWithin1Week'], [14, 'completedWithin2Weeks'], [28, 'completedWithin4Weeks'], [56, 'completedWithin8Weeks']] as const) if (elapsed <= limit) cohort[field]++; } cohorts.set(key, cohort); } return { cohorts: [...cohorts.values()].map((cohort) => ({ ...cohort, pctWithin1Week: cohort.totalEnrolled ? cohort.completedWithin1Week / cohort.totalEnrolled * 100 : 0, pctWithin2Weeks: cohort.totalEnrolled ? cohort.completedWithin2Weeks / cohort.totalEnrolled * 100 : 0, pctWithin4Weeks: cohort.totalEnrolled ? cohort.completedWithin4Weeks / cohort.totalEnrolled * 100 : 0, pctWithin8Weeks: cohort.totalEnrolled ? cohort.completedWithin8Weeks / cohort.totalEnrolled * 100 : 0 })) }; }
export async function clearMetrics(key?: string) { if (key) { clearCache(String(key)); return { success: true, cleared: key }; } clearCache(); return { success: true, cleared: 'all' }; }
export async function listTenants() { if (process.env.TENANTS_JSON) { try { const parsed = JSON.parse(process.env.TENANTS_JSON); if (Array.isArray(parsed)) return parsed; } catch {} } return [{ id: '__all', name: 'All tenants' }, { id: 'tenant_1', name: 'Acme University' }, { id: 'tenant_2', name: 'Partner Co' }]; }
export async function auditLogs(query: URLSearchParams) { const limit = Math.min(Number(query.get('limit')) || 50, 200); const page = Math.max(Number(query.get('page')) || 1, 1); const where = { resourceId: query.get('resourceId') || undefined, actionType: query.get('actionType') || undefined }; const [items, total] = await Promise.all([prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }), prisma.auditLog.count({ where })]); return { items, total, page, limit }; }
export async function assignTemplate(instructorId: string, template: any) { const instructor = await prisma.user.findUnique({ where: { id: instructorId }, select: { id: true, role: true } }); if (!instructor || instructor.role !== 'INSTRUCTOR') throw Object.assign(new Error('Instructor not found'), { status: 404 }); if (template !== null && (typeof template !== 'object' || Array.isArray(template))) throw Object.assign(new Error('Template must be an object or null'), { status: 400 }); const updated = await prisma.user.update({ where: { id: instructorId }, data: { certificateTemplate: template || null }, select: { id: true, certificateTemplate: true } }); return { message: 'Certificate template assigned', instructor: updated }; }
export async function issueCertificate(body: any, actor: any, request: Request) { const enrollment = body.enrollmentId ? await prisma.enrollment.findUnique({ where: { id: body.enrollmentId }, include: { user: true, course: { include: { instructor: true } } } }) : await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: body.userId, courseId: body.courseId } }, include: { user: true, course: { include: { instructor: true } } } }); if (!enrollment) throw Object.assign(new Error('Enrollment not found'), { status: 404 }); if (enrollment.status !== 'COMPLETED') throw Object.assign(new Error('Certificate can only be issued for completed enrollments'), { status: 400 }); const id = randomUUID(); const url = `${baseCertificateUrl()}/${id}/download`; const certificate = await prisma.certificate.create({ data: { id, enrollmentId: enrollment.id, serial: id, fileUrl: url, issuedAt: new Date(), metadata: { template: enrollment.course.instructor.certificateTemplate || null } } }); await prisma.enrollment.update({ where: { id: enrollment.id }, data: { certificate: { id, issuedAt: certificate.issuedAt, downloadUrl: url } } }); await prisma.auditLog.create({ data: { actorId: actor.id, actorRole: actor.role, actionType: 'ISSUE_CERTIFICATE', resourceType: 'Enrollment', resourceId: enrollment.id, details: { certificateId: id }, ipAddress: ipOf(request) } }); return { message: 'Certificate issued', certificate, enrollmentId: enrollment.id, user: { id: enrollment.user.id, name: enrollment.user.name, email: enrollment.user.email }, course: { id: enrollment.course.id, title: enrollment.course.title } }; }
export async function listCertificates(query: URLSearchParams) { const certificates = await prisma.certificate.findMany({ where: { enrollment: { userId: query.get('userId') || undefined, courseId: query.get('courseId') || undefined } }, include: { enrollment: { include: { user: { select: { id: true, name: true, email: true, role: true } }, course: { select: { id: true, title: true } } } } }, orderBy: { issuedAt: 'desc' } }); return { certificates: certificates.map((item) => ({ enrollmentId: item.enrollmentId, user: item.enrollment.user, course: item.enrollment.course, status: item.enrollment.status, certificate: { ...item, fileUrl: `${baseCertificateUrl()}/${item.id}/download` }, issuedAt: item.issuedAt })) }; }
