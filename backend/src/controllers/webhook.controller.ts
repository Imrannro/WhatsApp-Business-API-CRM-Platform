import { Request, Response } from 'express';
import { getWhatsAppProvider } from '../../../lib/whatsapp';
import { processWhatsAppWebhook } from '../../../lib/webhook/processor';
import { dbStore } from '../../../lib/db/store';
import { MetaWebhookPayload } from '../../../lib/whatsapp/types';

export class WebhookController {
  /**
   * GET /api/webhooks/whatsapp
   * Meta Developer Webhook Verification Handshake
   */
  public static verify(req: Request, res: Response): void {
    const provider = getWhatsAppProvider();
    const verification = provider.verifyWebhook({
      'hub.mode': req.query['hub.mode'] as string,
      'hub.verify_token': req.query['hub.verify_token'] as string,
      'hub.challenge': req.query['hub.challenge'] as string,
    });

    if (verification.isValid && verification.challenge) {
      // Meta expects raw challenge string returned with status 200
      res.status(200).send(verification.challenge);
      return;
    }

    res.status(403).json({
      success: false,
      error: 'Webhook verification token mismatch or invalid hub.mode',
    });
  }

  /**
   * POST /api/webhooks/whatsapp
   * Meta Webhook Inbound Message & Status Dispatch
   */
  public static async handleEvent(req: Request, res: Response): Promise<void> {
    const provider = getWhatsAppProvider();
    const signature = req.headers['x-hub-signature-256'] as string | undefined;

    // Validate signature
    const isValidSignature = provider.validateSignature(
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
      signature
    );

    if (!isValidSignature) {
      res.status(401).json({ success: false, error: 'Invalid webhook signature' });
      return;
    }

    try {
      const payload = req.body as MetaWebhookPayload;
      const result = await processWhatsAppWebhook(payload);

      // Meta requires 200 OK fast response to prevent webhook retries
      res.status(200).json({
        success: true,
        summary: result,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown webhook error';
      console.error('[WEBHOOK ERROR]', errorMsg);
      res.status(500).json({ success: false, error: 'Webhook processing exception' });
    }
  }

  /**
   * GET /api/webhooks/whatsapp/events
   * Inspection endpoint for monitoring received events
   */
  public static async getEvents(_req: Request, res: Response): Promise<void> {
    const events = await dbStore.getAllWebhookEvents(50);
    res.status(200).json({ success: true, count: events.length, data: events });
  }

  /**
   * POST /api/webhooks/whatsapp/simulate
   * Dev/Mock Simulator endpoint for testing inbound messages or status changes
   */
  public static async simulate(req: Request, res: Response): Promise<void> {
    const { type, phoneNumber, name, text, messageId, status } = req.body;

    if (type === 'STATUS_UPDATE') {
      const targetWamid = messageId;
      const newStatus = status || 'DELIVERED';
      const updated = await dbStore.updateMessageStatus(targetWamid, newStatus);
      if (!updated) {
        res.status(404).json({ success: false, error: 'Target message ID not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Status simulated', data: updated });
      return;
    }

    // Default: Simulate Inbound Message
    const senderPhone = phoneNumber || '+15550998877';
    const senderName = name || 'Simulated Customer';
    const messageText = text || 'Hi, this is a simulated WhatsApp incoming message!';
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
    res.status(200).json({
      success: true,
      message: 'Simulated inbound message dispatched through webhook processor',
      result,
      wamid: generatedWamid,
    });
  }
}
