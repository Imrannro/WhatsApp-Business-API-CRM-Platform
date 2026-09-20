import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();
let authToken: string;

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@enterprise-whatsapp.io',
      password: 'AdminPassword123!',
    });
  authToken = loginRes.body.data.token;
});

describe('Contacts CRM API Endpoints', () => {
  it('should list contacts when authenticated', async () => {
    const res = await request(app)
      .get('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('should filter contacts by search term', async () => {
    const res = await request(app)
      .get('/api/contacts?search=Elena')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some((c: any) => c.name.includes('Elena'))).toBe(true);
  });

  it('should create a new contact with valid phone number', async () => {
    const uniquePhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Jordan Belfort',
        phoneNumber: uniquePhone,
        email: 'jordan@strattonevents.com',
        company: 'Stratton Oakmont',
        tags: ['Lead', 'High-Touch'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phoneNumber).toBe(uniquePhone);
  });

  it('should update contact tags and notes', async () => {
    const contactsRes = await request(app)
      .get('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`);

    const targetContact = contactsRes.body.data[0];

    const updateRes = await request(app)
      .patch(`/api/contacts/${targetContact.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        notes: 'Updated CRM note via test suite verification.',
        tags: [...targetContact.tags, 'Verified'],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.notes).toBe('Updated CRM note via test suite verification.');
    expect(updateRes.body.data.tags).toContain('Verified');
  });
});
