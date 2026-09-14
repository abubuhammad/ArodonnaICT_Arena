import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const roleEnum = (role || 'STUDENT').toString().toUpperCase();
    const created = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role:
          roleEnum === 'INSTRUCTOR'
            ? 'INSTRUCTOR'
            : roleEnum === 'ADMIN'
              ? 'ADMIN'
              : roleEnum === 'PENDING'
                ? 'PENDING'
                : 'STUDENT',
      },
    });

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: { id: created.id, name: created.name, email: created.email, role: created.role },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
