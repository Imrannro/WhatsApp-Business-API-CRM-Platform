import { describe, it, expect } from 'vitest';
import { MockWhatsAppProvider } from '../../lib/whatsapp/mock.provider';
import { MetaWhatsAppProvider } from '../../lib/whatsapp/meta.provider';

describe('WhatsApp Provider Architecture', () => {
  describe('MockWhatsAppProvider', () => {
    const mockProvider = new MockWhatsAppProvider();

    it('should identify as mock provider', () => {
      expect(mockProvider.isMock).toBe(true);
      expect(mockProvider.name).toContain('Mock');
    });

    it('should verify webhook handshake', () => {
      const result = mockProvider.verifyWebhook({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'whatsapp_webhook_secret_token_123',
        'hub.challenge': 'mock_challenge_code',
      });
      expect(result.isValid).toBe(true);
      expect(result.challenge).toBe('mock_challenge_code');
    });

    it('should simulate sending text message and generate wamid', async () => {
      const sendResult = await mockProvider.sendTextMessage({
        to: '+15550192834',
        text: 'Hello from test suite simulation',
      });
      expect(sendResult.success).toBe(true);
      expect(sendResult.status).toBe('SENT');
      expect(sendResult.whatsappMessageId).toMatch(/^wamid\.mock\./);
    });

    it('should simulate sending template message', async () => {
      const sendResult = await mockProvider.sendTemplateMessage({
        to: '+15550192834',
        templateName: 'sample_shipping_confirmation',
      });
      expect(sendResult.success).toBe(true);
      expect(sendResult.whatsappMessageId).toMatch(/^wamid\.mock\.tpl\./);
    });
  });

  describe('MetaWhatsAppProvider', () => {
    const metaProvider = new MetaWhatsAppProvider();

    it('should identify as real Meta provider', () => {
      expect(metaProvider.isMock).toBe(false);
      expect(metaProvider.name).toBe('Meta Cloud API');
    });

    it('should fail gracefully if credentials missing', async () => {
      const res = await metaProvider.sendTextMessage({
        to: '+15550192834',
        text: 'Testing credentials check',
      });
      // If no credentials in test environment, it returns failure safely without crashing
      if (!process.env.META_ACCESS_TOKEN) {
        expect(res.success).toBe(false);
        expect(res.status).toBe('FAILED');
        expect(res.error).toContain('Missing');
      }
    });
  });
});
