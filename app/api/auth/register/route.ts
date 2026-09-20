import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { hashPassword, generateToken } from '@/lib/auth';
import { registerSchema } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, password, name, role } = validation.data;
    const existing = await dbStore.findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await dbStore.createUser({
      email,
      passwordHash,
      name,
      role: role || 'AGENT',
    });

    const token = generateToken(user);
    const { passwordHash: _p, ...safeUser } = user;

    await dbStore.createAuditLog({
      userId: user.id,
      action: 'USER_REGISTER',
      resource: 'User',
      resourceId: user.id,
      details: { email: user.email, role: user.role },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
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
    const msg = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
