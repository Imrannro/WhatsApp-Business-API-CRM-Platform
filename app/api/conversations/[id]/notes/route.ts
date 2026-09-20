import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { authenticateRequest } from '@/lib/auth';
import { internalNoteSchema } from '@/lib/validation/schemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const user = await authenticateRequest(
    req.headers.get('authorization'),
    req.cookies.get('token')?.value
  );
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const conversation = await dbStore.findConversationById(id);
  if (!conversation) {
    return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const validation = internalNoteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const note = await dbStore.createInternalNote({
      conversationId: id,
      userId: user.id,
      content: validation.data.content,
    });

    await dbStore.createAuditLog({
      userId: user.id,
      action: 'INTERNAL_NOTE_ADD',
      resource: 'InternalNote',
      resourceId: note.id,
      details: { conversationId: id },
    });

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error adding internal note';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
