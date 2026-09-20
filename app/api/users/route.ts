import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { authenticateRequest, hashPassword } from '@/lib/auth';
import { userCreateSchema } from '@/lib/validation/schemas';

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(
    req.headers.get('authorization'),
    req.cookies.get('token')?.value
  );
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const users = await dbStore.getAllUsers();
  return NextResponse.json({ success: true, count: users.length, data: users });
}

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(
    req.headers.get('authorization'),
    req.cookies.get('token')?.value
  );
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Admin privilege required' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validation = userCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const existing = await dbStore.findUserByEmail(validation.data.email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(validation.data.password);
    const newUser = await dbStore.createUser({
      email: validation.data.email,
      passwordHash,
      name: validation.data.name,
      role: validation.data.role,
    });

    const { passwordHash: _p, ...safeUser } = newUser;

    await dbStore.createAuditLog({
      userId: user.id,
      action: 'USER_CREATE',
      resource: 'User',
      resourceId: newUser.id,
      details: { email: newUser.email, role: newUser.role, name: newUser.name },
    });

    return NextResponse.json({ success: true, data: safeUser }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error creating user';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
