import { WhatsAppProvider } from './provider.interface';
import {
  WhatsAppTextMessagePayload,
  WhatsAppTemplateMessagePayload,
  WhatsAppSendResult,
  WhatsAppWebhookVerificationQuery,
} from './types';
import { dbStore } from '../db/store';

export class MockWhatsAppProvider implements WhatsAppProvider {
  public readonly name = 'Development Mock Provider';
  public readonly isMock = true;

  private verifyToken: string;

  constructor() {
    this.verifyToken = process.env.META_VERIFY_TOKEN || 'whatsapp_webhook_secret_token_123';
  }

  public verifyWebhook(query: WhatsAppWebhookVerificationQuery): {
    isValid: boolean;
    challenge?: string;
  } {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    // In mock mode, we also accept if token matches verifyToken or default test token
    if (
      mode === 'subscribe' &&
      (token === this.verifyToken || token === 'whatsapp_webhook_secret_token_123' || !token)
    ) {
      return { isValid: true, challenge: challenge || 'mock_challenge_ok_123' };
    }
    return { isValid: false };
  }

  public validateSignature(_rawBody: string | Buffer, _signatureHeader?: string): boolean {
    // In mock mode, signature check is always permissive to ease local development and testing
    return true;
  }

  public async sendTextMessage(payload: WhatsAppTextMessagePayload): Promise<WhatsAppSendResult> {
    const mockWamid = `wamid.mock.${Date.now()}.${Math.random().toString(36).substr(2, 6)}`;

    // Simulate async delivery progression in background for mock realism
    setTimeout(async () => {
      try {
        await dbStore.updateMessageStatus(mockWamid, 'DELIVERED');
        setTimeout(async () => {
          await dbStore.updateMessageStatus(mockWamid, 'READ');
        }, 3000);
      } catch (_e) {
        // Ignored in mock background
      }
    }, 1500);

    return {
      success: true,
      whatsappMessageId: mockWamid,
      recipientPhone: payload.to,
      status: 'SENT',
      rawResponse: {
        messaging_product: 'whatsapp',
        contacts: [{ input: payload.to, wa_id: payload.to.replace(/[\s\-()+]/g, '') }],
        messages: [{ id: mockWamid, message_status: 'accepted' }],
        mock_mode: true,
      },
    };
  }

  public async sendTemplateMessage(
    payload: WhatsAppTemplateMessagePayload
  ): Promise<WhatsAppSendResult> {
    const mockWamid = `wamid.mock.tpl.${Date.now()}.${Math.random().toString(36).substr(2, 6)}`;

    setTimeout(async () => {
      try {
        await dbStore.updateMessageStatus(mockWamid, 'DELIVERED');
        setTimeout(async () => {
          await dbStore.updateMessageStatus(mockWamid, 'READ');
        }, 3000);
      } catch (_e) {
        // Ignored in mock background
      }
    }, 1500);

    return {
      success: true,
      whatsappMessageId: mockWamid,
      recipientPhone: payload.to,
      status: 'SENT',
      rawResponse: {
        messaging_product: 'whatsapp',
        template_name: payload.templateName,
        contacts: [{ input: payload.to, wa_id: payload.to.replace(/[\s\-()+]/g, '') }],
        messages: [{ id: mockWamid, message_status: 'accepted' }],
        mock_mode: true,
      },
    };
  }

  public getStatus() {
    return {
      configured: true,
      provider: 'Development Mock Provider (Zero-config sandbox mode)',
      phoneNumberId: 'MOCK_PHONE_NUMBER_ID_109283746',
      businessAccountId: 'MOCK_WABA_ID_982374615',
      apiVersion: 'v21.0 (Simulated)',
    };
  }
}
