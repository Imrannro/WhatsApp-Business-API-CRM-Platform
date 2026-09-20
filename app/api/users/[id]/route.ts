import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { authenticateRequest, hashPassword } from '@/lib/auth';
import { userUpdateSchema } from '@/lib/validation/schemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
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

  const { id } = await context.params;
  try {
    const body = await req.json();
    const validation = userUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (validation.data.name) updates.name = validation.data.name;
    if (validation.data.role) updates.role = validation.data.role;
    if (validation.data.status) updates.status = validation.data.status;
    if (validation.data.password) {
      updates.passwordHash = await hashPassword(validation.data.password);
    }

    const updated = await dbStore.updateUser(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const { passwordHash: _p, ...safeUser } = updated;

    await dbStore.createAuditLog({
      userId: user.id,
      action: 'USER_UPDATE',
      resource: 'User',
      resourceId: id,
      details: { role: validation.data.role, status: validation.data.status },
    });

    return NextResponse.json({ success: true, data: safeUser });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating user';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
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

  const { id } = await context.params;
  if (id === user.id) {
    return NextResponse.json(
      { success: false, error: 'Cannot delete your own active account' },
      { status: 400 }
    );
  }

  const success = await dbStore.deleteUser(id);
  if (!success) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  await dbStore.createAuditLog({
    userId: user.id,
    action: 'USER_DELETE',
    resource: 'User',
    resourceId: id,
  });

  return NextResponse.json({ success: true, message: 'User removed successfully' });
}
