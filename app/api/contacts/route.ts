import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { authenticateRequest } from '@/lib/auth';
import { contactCreateSchema } from '@/lib/validation/schemas';

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(
    req.headers.get('authorization'),
    req.cookies.get('token')?.value
  );
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const search = req.nextUrl.searchParams.get('search') || undefined;
  const tag = req.nextUrl.searchParams.get('tag') || undefined;

  const contacts = await dbStore.getAllContacts({ search, tag });
  return NextResponse.json({ success: true, count: contacts.length, data: contacts });
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
    const validation = contactCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const existing = await dbStore.findContactByPhone(validation.data.phoneNumber);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A contact with this phone number already exists', data: existing },
        { status: 409 }
      );
    }

    const contact = await dbStore.createContact(validation.data);
    await dbStore.createAuditLog({
      userId: user.id,
      action: 'CONTACT_CREATE',
      resource: 'Contact',
      resourceId: contact.id,
      details: { name: contact.name, phoneNumber: contact.phoneNumber },
    });

    return NextResponse.json({ success: true, data: contact }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error creating contact';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
