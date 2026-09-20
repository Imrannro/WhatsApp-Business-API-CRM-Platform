import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppProvider } from '@/lib/whatsapp';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(
    req.headers.get('authorization'),
    req.cookies.get('token')?.value
  );
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const provider = getWhatsAppProvider();
  return NextResponse.json({
    success: true,
    whatsapp: provider.getStatus(),
  });
}
