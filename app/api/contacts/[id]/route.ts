import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { authenticateRequest } from '@/lib/auth';
import { contactUpdateSchema } from '@/lib/validation/schemas';

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
  const contact = await dbStore.findContactById(id);
  if (!contact) {
    return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
  }

  const conversation = await dbStore.findConversationByContactId(contact.id);
  const messages = conversation
    ? await dbStore.getMessagesByConversationId(conversation.id)
    : [];

  return NextResponse.json({
    success: true,
    data: { contact, conversation, messages },
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
    const validation = contactUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updated = await dbStore.updateContact(id, validation.data);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    await dbStore.createAuditLog({
      userId: user.id,
      action: 'CONTACT_UPDATE',
      resource: 'Contact',
      resourceId: updated.id,
      details: body,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating contact';
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

  const { id } = await context.params;
  const success = await dbStore.deleteContact(id);
  if (!success) {
    return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
  }

  await dbStore.createAuditLog({
    userId: user.id,
    action: 'CONTACT_DELETE',
    resource: 'Contact',
    resourceId: id,
  });

  return NextResponse.json({ success: true, message: 'Contact deleted successfully' });
}
