import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

interface TokenPayload {
  id: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const cookieToken = request.cookies.get('refreshToken')?.value;
    const incomingRefreshToken = cookieToken || body.refreshToken;

    if (!incomingRefreshToken) {
      return NextResponse.json({ message: 'Refresh token is required' }, { status: 400 });
    }

    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as TokenPayload;

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const newToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, {
      expiresIn: '1d',
    });

    const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET as string, {
      expiresIn: '7d',
    });

    const response = NextResponse.json({
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json({ message: 'Refresh token expired' }, { status: 401 });
    }

    return NextResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
  }
}
