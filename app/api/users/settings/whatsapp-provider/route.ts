import { NextRequest, NextResponse } from 'next/server';
import { setWhatsAppProviderOverride } from '@/lib/whatsapp';
import { authenticateRequest } from '@/lib/auth';
import { dbStore } from '@/lib/db/store';

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
    const { provider } = body;
    if (provider !== 'meta' && provider !== 'mock') {
      return NextResponse.json(
        { success: false, error: 'Provider must be "meta" or "mock"' },
        { status: 400 }
      );
    }

    const active = setWhatsAppProviderOverride(provider);
    await dbStore.createAuditLog({
      userId: user.id,
      action: 'SETTINGS_UPDATE',
      resource: 'WhatsAppProvider',
      details: { provider: active.name, isMock: active.isMock },
    });

    return NextResponse.json({
      success: true,
      message: `WhatsApp provider set to ${active.name}`,
      status: active.getStatus(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error changing provider';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
