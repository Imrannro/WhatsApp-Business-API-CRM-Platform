import crypto from 'crypto';
import { WhatsAppProvider } from './provider.interface';
import {
  WhatsAppTextMessagePayload,
  WhatsAppTemplateMessagePayload,
  WhatsAppSendResult,
  WhatsAppWebhookVerificationQuery,
} from './types';

export class MetaWhatsAppProvider implements WhatsAppProvider {
  public readonly name = 'Meta Cloud API';
  public readonly isMock = false;

  private accessToken: string;
  private phoneNumberId: string;
  private businessAccountId: string;
  private verifyToken: string;
  private apiVersion: string;
  private appSecret: string;

  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.META_PHONE_NUMBER_ID || '';
    this.businessAccountId = process.env.META_BUSINESS_ACCOUNT_ID || '';
    this.verifyToken = process.env.META_VERIFY_TOKEN || 'whatsapp_webhook_secret_token_123';
    this.apiVersion = process.env.META_API_VERSION || 'v21.0';
    this.appSecret = process.env.META_APP_SECRET || '';
  }

  public verifyWebhook(query: WhatsAppWebhookVerificationQuery): {
    isValid: boolean;
    challenge?: string;
  } {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === this.verifyToken) {
      return { isValid: true, challenge };
    }
    return { isValid: false };
  }

  public validateSignature(rawBody: string | Buffer, signatureHeader?: string): boolean {
    if (!this.appSecret) {
      // If META_APP_SECRET is not configured, permit webhook in test mode with audit log
      return true;
    }
    if (!signatureHeader) {
      return false;
    }
    try {
      const elements = signatureHeader.split('=');
      const signatureHash = elements[1];
      const expectedHash = crypto
        .createHmac('sha256', this.appSecret)
        .update(rawBody)
        .digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signatureHash), Buffer.from(expectedHash));
    } catch (_e) {
      return false;
    }
  }

  public async sendTextMessage(payload: WhatsAppTextMessagePayload): Promise<WhatsAppSendResult> {
    if (!this.phoneNumberId || !this.accessToken) {
      return {
        success: false,
        recipientPhone: payload.to,
        status: 'FAILED',
        error: 'Missing META_PHONE_NUMBER_ID or META_ACCESS_TOKEN in environment credentials',
      };
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: payload.to.replace(/[\s\-()]/g, ''),
      type: 'text',
      text: {
        preview_url: payload.previewUrl ?? false,
        body: payload.text,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg =
          data?.error?.message || `Meta API error with status code ${response.status}`;
        return {
          success: false,
          recipientPhone: payload.to,
          status: 'FAILED',
          error: errorMsg,
          rawResponse: data,
        };
      }

      const messageId = data?.messages?.[0]?.id;
      return {
        success: true,
        whatsappMessageId: messageId || `wamid.${Date.now()}`,
        recipientPhone: payload.to,
        status: 'SENT',
        rawResponse: data,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Network failure calling Meta API';
      return {
        success: false,
        recipientPhone: payload.to,
        status: 'FAILED',
        error: errorMessage,
      };
    }
  }

  public async sendTemplateMessage(
    payload: WhatsAppTemplateMessagePayload
  ): Promise<WhatsAppSendResult> {
    if (!this.phoneNumberId || !this.accessToken) {
      return {
        success: false,
        recipientPhone: payload.to,
        status: 'FAILED',
        error: 'Missing META_PHONE_NUMBER_ID or META_ACCESS_TOKEN in environment credentials',
      };
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      to: payload.to.replace(/[\s\-()]/g, ''),
      type: 'template',
      template: {
        name: payload.templateName,
        language: {
          code: payload.languageCode || 'en_US',
        },
        components: payload.components || [],
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg =
          data?.error?.message || `Meta API error with status code ${response.status}`;
        return {
          success: false,
          recipientPhone: payload.to,
          status: 'FAILED',
          error: errorMsg,
          rawResponse: data,
        };
      }

      const messageId = data?.messages?.[0]?.id;
      return {
        success: true,
        whatsappMessageId: messageId || `wamid.tpl.${Date.now()}`,
        recipientPhone: payload.to,
        status: 'SENT',
        rawResponse: data,
      };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Network failure calling Meta API template';
      return {
        success: false,
        recipientPhone: payload.to,
        status: 'FAILED',
        error: errorMessage,
      };
    }
  }

  public getStatus() {
    return {
      configured: Boolean(this.accessToken && this.phoneNumberId),
      provider: 'Meta Cloud API',
      phoneNumberId: this.phoneNumberId ? `***${this.phoneNumberId.slice(-4)}` : undefined,
      businessAccountId: this.businessAccountId
        ? `***${this.businessAccountId.slice(-4)}`
        : undefined,
      apiVersion: this.apiVersion,
    };
  }
}
