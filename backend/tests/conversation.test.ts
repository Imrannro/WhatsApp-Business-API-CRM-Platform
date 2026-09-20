import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();
let adminToken: string;
let agentToken: string;
let conversationId: string;

beforeAll(async () => {
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@enterprise-whatsapp.io',
      password: 'AdminPassword123!',
    });
  adminToken = adminLogin.body.data.token;

  const agentLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'agent.sarah@enterprise-whatsapp.io',
      password: 'AgentPassword123!',
    });
  agentToken = agentLogin.body.data.token;

  const convList = await request(app)
    .get('/api/conversations')
    .set('Authorization', `Bearer ${adminToken}`);
  conversationId = convList.body.data[0].id;
});

describe('Conversations and Messaging API', () => {
  it('should list all conversations for admin', async () => {
    const res = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('should get conversation details with messages and notes', async () => {
    const res = await request(app)
      .get(`/api/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.conversation).toBeDefined();
    expect(Array.isArray(res.body.data.messages)).toBe(true);
    expect(Array.isArray(res.body.data.internalNotes)).toBe(true);
  });

  it('should allow agent to send outbound WhatsApp message', async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        body: 'Hello, your support ticket has been prioritized by our engineering team.',
        type: 'TEXT',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.direction).toBe('OUTBOUND');
    expect(res.body.data.whatsappMessageId).toBeDefined();
  });

  it('should allow agent to add an internal note', async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/notes`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        content: 'Customer is on SLA tier 1. Follow up tomorrow if no reply.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toContain('SLA tier 1');
  });

  it('should allow admin to reassign conversation', async () => {
    const usersRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    const agent = usersRes.body.data.find((u: any) => u.role === 'AGENT');

    const res = await request(app)
      .post(`/api/conversations/${conversationId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        agentId: agent.id,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.assignedAgentId).toBe(agent.id);
  });
});
