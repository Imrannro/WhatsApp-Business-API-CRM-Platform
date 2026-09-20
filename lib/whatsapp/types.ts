export interface WhatsAppTextMessagePayload {
  to: string;
  text: string;
  previewUrl?: boolean;
}

export interface WhatsAppTemplateMessagePayload {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: Array<{
    type: 'header' | 'body' | 'button';
    parameters: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
      text?: string;
      image?: { link: string };
      document?: { link: string; filename?: string };
    }>;
  }>;
}

export interface WhatsAppSendResult {
  success: boolean;
  whatsappMessageId?: string;
  recipientPhone: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  error?: string;
  rawResponse?: unknown;
}

export interface WhatsAppWebhookVerificationQuery {
  'hub.mode'?: string;
  'hub.verify_token'?: string;
  'hub.challenge'?: string;
}

export interface MetaWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { id: string; mime_type: string; sha256: string; caption?: string };
          document?: { id: string; filename: string; mime_type: string; sha256: string };
          errors?: Array<{ code: number; title: string; message: string }>;
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          conversation?: { id: string; origin: { type: string } };
          pricing?: { billable: boolean; pricing_model: string; category: string };
          errors?: Array<{ code: number; title: string; message: string }>;
        }>;
      };
      field: string;
    }>;
  }>;
}
