import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { authenticateRequest } from '@/lib/auth';
import { conversationAssignSchema } from '@/lib/validation/schemas';

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

  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Admin role required to assign tickets' },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  try {
    const body = await req.json();
    const validation = conversationAssignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { agentId } = validation.data;
    let agentName = 'Unassigned';

    if (agentId) {
      const agent = await dbStore.findUserById(agentId);
      if (!agent) {
        return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
      }
      agentName = agent.name;
    }

    const updated = await dbStore.updateConversation(id, { assignedAgentId: agentId });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    await dbStore.createAuditLog({
      userId: user.id,
      action: 'CONVERSATION_ASSIGN',
      resource: 'Conversation',
      resourceId: id,
      details: { assignedAgentId: agentId, assignedAgentName: agentName },
    });

    return NextResponse.json({
      success: true,
      message: `Assigned to ${agentName}`,
      data: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error assigning conversation';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
