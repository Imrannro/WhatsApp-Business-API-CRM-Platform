import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('WhatsApp Webhook Verification & Processing', () => {
  it('should verify webhook handshake with Meta verify token (GET)', async () => {
    const challengeCode = 'meta_test_challenge_12345';
    const res = await request(app)
      .get('/api/webhooks/whatsapp')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'whatsapp_webhook_secret_token_123',
        'hub.challenge': challengeCode,
      });

    expect(res.status).toBe(200);
    expect(res.text).toBe(challengeCode);
  });

  it('should reject webhook handshake with incorrect verify token (GET)', async () => {
    const res = await request(app)
      .get('/api/webhooks/whatsapp')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'incorrect_token',
        'hub.challenge': '12345',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should process inbound message webhook and auto-create contact (POST)', async () => {
    const testWamid = `wamid.test.${Date.now()}`;
    const testPhone = '15559876543';

    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WABA_ID_TEST',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '+15551234567',
                  phone_number_id: 'PHONE_ID_TEST',
                },
                contacts: [
                  {
                    profile: { name: 'Automated Test User' },
                    wa_id: testPhone,
                  },
                ],
                messages: [
                  {
                    from: testPhone,
                    id: testWamid,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    type: 'text',
                    text: { body: 'Inbound message from automated test suite' },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const res = await request(app)
      .post('/api/webhooks/whatsapp')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.messagesHandled).toBe(1);

    // Test idempotency: resending the same message ID should be ignored as duplicate
    const resDuplicate = await request(app)
      .post('/api/webhooks/whatsapp')
      .send(payload);

    expect(resDuplicate.status).toBe(200);
    expect(resDuplicate.body.summary.duplicateIgnored).toBe(1);
    expect(resDuplicate.body.summary.messagesHandled).toBe(0);
  });

  it('should process status receipt webhook (DELIVERED and READ)', async () => {
    const testWamid = `wamid.receipt.${Date.now()}`;

    // First create message via webhook
    await request(app)
      .post('/api/webhooks/whatsapp')
      .send({
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_ID_TEST',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  messages: [
                    {
                      from: '15551112233',
                      id: testWamid,
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      type: 'text',
                      text: { body: 'Testing status receipt updates' },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      });

    // Now send status update
    const statusPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WABA_ID_TEST',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                statuses: [
                  {
                    id: testWamid,
                    status: 'read',
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    recipient_id: '15551112233',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const resStatus = await request(app)
      .post('/api/webhooks/whatsapp')
      .send(statusPayload);

    expect(resStatus.status).toBe(200);
    expect(resStatus.body.summary.statusesHandled).toBe(1);
  });
});
