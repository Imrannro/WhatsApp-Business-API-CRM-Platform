import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppProvider } from '@/lib/whatsapp';
import { processWhatsAppWebhook } from '@/lib/webhook/processor';
import { MetaWebhookPayload } from '@/lib/whatsapp/types';

/**
 * GET /api/webhooks/whatsapp
 * Meta WhatsApp Webhook Verification Endpoint
 */
export async function GET(req: NextRequest) {
  const provider = getWhatsAppProvider();
  const searchParams = req.nextUrl.searchParams;

  const mode = searchParams.get('hub.mode') || undefined;
  const token = searchParams.get('hub.verify_token') || undefined;
  const challenge = searchParams.get('hub.challenge') || undefined;

  const verification = provider.verifyWebhook({
    'hub.mode': mode,
    'hub.verify_token': token,
    'hub.challenge': challenge,
  });

  if (verification.isValid && verification.challenge) {
    // Return plain text challenge as required by Meta Developer Webhook guidelines
    return new NextResponse(verification.challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json(
    { success: false, error: 'Verification failed: invalid token or mode' },
    { status: 403 }
  );
}

/**
 * POST /api/webhooks/whatsapp
 * Meta WhatsApp Webhook Inbound Message & Status Dispatch
 */
export async function POST(req: NextRequest) {
  const provider = getWhatsAppProvider();
  const signature = req.headers.get('x-hub-signature-256') || undefined;

  let rawBodyText = '';
  let payload: MetaWebhookPayload;

  try {
    rawBodyText = await req.text();
    payload = JSON.parse(rawBodyText);
  } catch (_e) {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Validate HMAC SHA-256 signature
  const isValidSignature = provider.validateSignature(rawBodyText, signature);
  if (!isValidSignature) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid webhook signature' },
      { status: 401 }
    );
  }

  try {
    const summary = await processWhatsAppWebhook(payload);
    // Fast 200 OK
    return NextResponse.json({ success: true, summary });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Webhook error';
    console.error('[WEBHOOK ERROR]', errorMsg);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
