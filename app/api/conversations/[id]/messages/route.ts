import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { authenticateRequest } from '@/lib/auth';
import { getWhatsAppProvider } from '@/lib/whatsapp';
import { sendMessageSchema } from '@/lib/validation/schemas';

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
  const messages = await dbStore.getMessagesByConversationId(id);
  return NextResponse.json({ success: true, count: messages.length, data: messages });
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
  if (!conversation || !conversation.contact) {
    return NextResponse.json(
      { success: false, error: 'Conversation or Contact not found' },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const validation = sendMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const provider = getWhatsAppProvider();
    let sendResult;

    if (validation.data.type === 'TEMPLATE' && validation.data.templateName) {
      sendResult = await provider.sendTemplateMessage({
        to: conversation.contact.phoneNumber,
        templateName: validation.data.templateName,
      });
    } else {
      sendResult = await provider.sendTextMessage({
        to: conversation.contact.phoneNumber,
        text: validation.data.body,
      });
    }

    const message = await dbStore.createMessage({
      conversationId: conversation.id,
      whatsappMessageId: sendResult.whatsappMessageId,
      direction: 'OUTBOUND',
      type: validation.data.type || 'TEXT',
      body: validation.data.body,
      status: sendResult.status,
      senderPhone: 'Business Support',
      recipientPhone: conversation.contact.phoneNumber,
      errorMessage: sendResult.error,
      metadata: {
        provider: provider.name,
        isMock: provider.isMock,
        sentByUserId: user.id,
        sentByUserName: user.name,
      },
    });

    await dbStore.createAuditLog({
      userId: user.id,
      action: 'MESSAGE_SEND',
      resource: 'Message',
      resourceId: message.id,
      details: {
        recipient: conversation.contact.phoneNumber,
        provider: provider.name,
        status: sendResult.status,
        whatsappMessageId: sendResult.whatsappMessageId,
      },
    });

    return NextResponse.json(
      {
        success: sendResult.success,
        data: message,
        provider: { name: provider.name, isMock: provider.isMock },
        error: sendResult.error,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error sending message';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
