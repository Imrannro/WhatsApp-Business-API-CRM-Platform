import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { authenticateRequest } from '@/lib/auth';
import { conversationCreateSchema } from '@/lib/validation/schemas';
import { ConversationStatus } from '@/lib/db/types';

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(
    req.headers.get('authorization'),
    req.cookies.get('token')?.value
  );
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const status = (req.nextUrl.searchParams.get('status') as ConversationStatus) || undefined;
  const assignedAgentId = req.nextUrl.searchParams.get('assignedAgentId') || undefined;
  const unreadOnly = req.nextUrl.searchParams.get('unreadOnly') === 'true';
  const search = req.nextUrl.searchParams.get('search') || undefined;
  const all = req.nextUrl.searchParams.get('all') === 'true';

  let filterAgentId = assignedAgentId;
  if (user.role === 'AGENT' && !all && !assignedAgentId) {
    filterAgentId = user.id;
  }

  const conversations = await dbStore.getAllConversations({
    status,
    assignedAgentId: filterAgentId,
    unreadOnly,
    search,
  });

  return NextResponse.json({ success: true, count: conversations.length, data: conversations });
}

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(
    req.headers.get('authorization'),
    req.cookies.get('token')?.value
  );
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = conversationCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const conversation = await dbStore.createConversation({
      contactId: validation.data.contactId,
      assignedAgentId: validation.data.assignedAgentId || (user.role === 'AGENT' ? user.id : null),
      subject: validation.data.subject,
      priority: validation.data.priority,
    });

    await dbStore.createAuditLog({
      userId: user.id,
      action: 'CONVERSATION_CREATE',
      resource: 'Conversation',
      resourceId: conversation.id,
      details: { contactId: validation.data.contactId, subject: validation.data.subject },
    });

    return NextResponse.json({ success: true, data: conversation }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error creating conversation';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
