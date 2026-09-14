import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const baseUrl = 'http://localhost:3000';

async function ensureUser() {
  const email = 'smoke.user@example.com';
  const password = 'Password123!';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { email, password, user: existing };
  }

  const created = await prisma.user.create({
    data: {
      name: 'Smoke User',
      email,
      password: await bcrypt.hash(password, 10),
      role: 'STUDENT',
    },
  });

  return { email, password, user: created };
}

async function main() {
  const { email, password } = await ensureUser();

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const loginData = await loginRes.json();
  console.log('LOGIN_STATUS', loginRes.status);
  console.log('LOGIN_BODY', JSON.stringify(loginData, null, 2));

  const protectedRes = await fetch(`${baseUrl}/api/auth/protected`);
  console.log('PROTECTED_NO_TOKEN_STATUS', protectedRes.status);
  console.log('PROTECTED_NO_TOKEN_BODY', JSON.stringify(await protectedRes.json(), null, 2));

  const token = loginData.token;
  const authorizedRes = await fetch(`${baseUrl}/api/auth/protected`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('PROTECTED_WITH_TOKEN_STATUS', authorizedRes.status);
  console.log('PROTECTED_WITH_TOKEN_BODY', JSON.stringify(await authorizedRes.json(), null, 2));

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
