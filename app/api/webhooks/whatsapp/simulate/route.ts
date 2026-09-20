import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { processWhatsAppWebhook } from '@/lib/webhook/processor';
import { MetaWebhookPayload } from '@/lib/whatsapp/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, phoneNumber, name, text, messageId, status } = body;

    if (type === 'STATUS_UPDATE') {
      const targetWamid = messageId;
      const newStatus = status || 'DELIVERED';
      const updated = await dbStore.updateMessageStatus(targetWamid, newStatus);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Target message ID not found in database' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: `Status updated to ${newStatus}`,
        data: updated,
      });
    }

    const senderPhone = phoneNumber || '+15550998877';
    const senderName = name || 'Simulated Customer';
    const messageText = text || 'Hi! Testing WhatsApp Inbound Webhook handling.';
    const generatedWamid = `wamid.sim.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`;

    const simulatedMetaPayload: MetaWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '+15551234567',
                  phone_number_id: 'PHONE_NUMBER_ID_123',
                },
                contacts: [
                  {
                    profile: { name: senderName },
                    wa_id: senderPhone.replace(/[\s\-()+]/g, ''),
                  },
                ],
                messages: [
                  {
                    from: senderPhone.replace(/[\s\-()+]/g, ''),
                    id: generatedWamid,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    type: 'text',
                    text: { body: messageText },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const result = await processWhatsAppWebhook(simulatedMetaPayload);
    return NextResponse.json({
      success: true,
      message: 'Simulated inbound message processed successfully',
      result,
      wamid: generatedWamid,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Simulation failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
