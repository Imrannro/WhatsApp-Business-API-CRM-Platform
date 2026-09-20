import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { comparePassword, generateToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const user = await dbStore.findUserByEmail(email);

    if (!user || user.status === 'INACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = generateToken(user);
    const { passwordHash: _p, ...safeUser } = user;

    await dbStore.createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'User',
      resourceId: user.id,
      details: { email: user.email, method: 'PASSWORD' },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      data: { user: safeUser, token },
    });

    response.cookies.set('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
