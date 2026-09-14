import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  await prisma.$queryRaw`SELECT 1`;

  return Response.json({ ok: true });
}
