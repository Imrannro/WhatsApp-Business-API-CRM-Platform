import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { authenticateRequest } from '@/lib/auth';
import { conversationUpdateSchema } from '@/lib/validation/schemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
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

  if (
    user.role === 'AGENT' &&
    conversation.assignedAgentId &&
    conversation.assignedAgentId !== user.id
  ) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Access limited to your assigned tickets' },
      { status: 403 }
    );
  }

  const messages = await dbStore.getMessagesByConversationId(conversation.id);
  const internalNotes = await dbStore.getInternalNotesByConversationId(conversation.id);

  if (conversation.unreadCount > 0) {
    await dbStore.updateConversation(conversation.id, { unreadCount: 0 });
    conversation.unreadCount = 0;
  }

  return NextResponse.json({
    success: true,
    data: { conversation, messages, internalNotes },
  });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const user = await authenticateRequest(
    req.headers.get('authorization'),
    req.cookies.get('token')?.value
  );
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const body = await req.json();
    const validation = conversationUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updated = await dbStore.updateConversation(id, validation.data);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    await dbStore.createAuditLog({
      userId: user.id,
      action: 'CONVERSATION_UPDATE',
      resource: 'Conversation',
      resourceId: id,
      details: body,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating conversation';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
