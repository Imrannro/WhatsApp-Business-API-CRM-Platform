import {
  WhatsAppTextMessagePayload,
  WhatsAppTemplateMessagePayload,
  WhatsAppSendResult,
  WhatsAppWebhookVerificationQuery,
} from './types';

export interface WhatsAppProvider {
  readonly name: string;
  readonly isMock: boolean;

  /**
   * Verify webhook subscription handshake from Meta Developer Portal
   */
  verifyWebhook(query: WhatsAppWebhookVerificationQuery): {
    isValid: boolean;
    challenge?: string;
  };

  /**
   * Validate HMAC SHA-256 signature if app secret is configured
   */
  validateSignature(rawBody: string | Buffer, signatureHeader?: string): boolean;

  /**
   * Send an outbound plain-text message via WhatsApp Cloud API
   */
  sendTextMessage(payload: WhatsAppTextMessagePayload): Promise<WhatsAppSendResult>;

  /**
   * Send an outbound approved business template message
   */
  sendTemplateMessage(payload: WhatsAppTemplateMessagePayload): Promise<WhatsAppSendResult>;

  /**
   * Check connection status / credentials health
   */
  getStatus(): {
    configured: boolean;
    provider: string;
    phoneNumberId?: string;
    businessAccountId?: string;
    apiVersion: string;
  };
}
