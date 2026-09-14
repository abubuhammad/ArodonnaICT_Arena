import { NextRequest, NextResponse } from 'next/server';
import { updateCourseStatus } from '@/lib/admin';
import { adminGuard, routeError } from '@/app/api/admin/_utils';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try { const actor = await adminGuard(request); return NextResponse.json(await updateCourseStatus((await params).courseId, await request.json(), actor, request)); }
  catch (error) { return routeError(error, 'Failed to update course status'); }
}
