import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { sfClient } from '../../lib/salesforce/client';

const app = createApp();
let adminToken: string;

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@enterprise-whatsapp.io',
      password: 'AdminPassword123!',
    });
  adminToken = loginRes.body.data.token;
});

describe('Salesforce CRM Integration Endpoints & Engine', () => {
  it('should return initial Salesforce integration status', async () => {
    const res = await request(app)
      .get('/api/salesforce/status');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('mappingsCount');
    expect(res.body.data.mappingsCount).toBeGreaterThan(0);
  });

  it('should generate a valid Salesforce OAuth 2.0 authorization URL', async () => {
    const res = await request(app)
      .get('/api/salesforce/auth-url?clientId=3MVG9_TEST_CLIENT_ID&environment=production');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.authUrl).toContain('https://login.salesforce.com/services/oauth2/authorize');
    expect(res.body.authUrl).toContain('client_id=3MVG9_TEST_CLIENT_ID');
    expect(res.body.authUrl).toContain('response_type=code');
  });

  it('should connect to Salesforce directly with valid credentials', async () => {
    // Mock the lightweight organization query
    vi.spyOn(sfClient, 'query').mockResolvedValueOnce({
      totalSize: 1,
      done: true,
      records: [{ Id: '00D8c000008TestOrg' }],
    });

    const res = await request(app)
      .post('/api/salesforce/connect-direct')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        instanceUrl: 'https://custom-domain.my.salesforce.com',
        accessToken: '00D8c000008TestAccessToken',
        refreshToken: '5Aep861RefreshSecretToken',
        environment: 'production',
        targetObject: 'Contact',
        autoSyncMessages: true,
        autoSyncContacts: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CONNECTED');
    expect(res.body.data.instanceUrl).toBe('https://custom-domain.my.salesforce.com');
  });

  it('should sync Salesforce Contacts inbound with duplicate detection and matching', async () => {
    // Mock SOQL Contact Query response from Salesforce
    vi.spyOn(sfClient, 'query').mockImplementation(async (soql: string) => {
      if (soql.includes('FROM Contact')) {
        return {
          totalSize: 2,
          done: true,
          records: [
            {
              Id: '0038c00003MockContact1',
              FirstName: 'Marc',
              LastName: 'Benioff',
              Name: 'Marc Benioff',
              Email: 'marc@salesforce.com',
              Phone: '+14155550100',
              Department: 'Executive',
              Description: 'Founder & CEO of Salesforce',
              LastModifiedDate: new Date().toISOString(),
            },
            {
              Id: '0038c00003MockContact2',
              FirstName: 'Elena',
              LastName: 'Rostova',
              Name: 'Elena Rostova',
              Email: 'elena.rostova@techglobal.corp',
              Phone: '+14155550198',
              Department: 'Procurement',
              Description: 'Existing customer from TechGlobal',
              LastModifiedDate: new Date().toISOString(),
            },
          ],
        };
      }
      return { totalSize: 0, done: true, records: [] };
    });

    const res = await request(app)
      .post('/api/salesforce/sync')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ entityType: 'CONTACT' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recordsProcessed).toBe(2);
    expect(res.body.data.recordsSynced).toBeGreaterThanOrEqual(1);

    // Verify contact matching on Elena Rostova
    const contactsRes = await request(app)
      .get('/api/contacts?search=Marc Benioff')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(contactsRes.body.count).toBe(1);
    expect(contactsRes.body.data[0].salesforceId).toBe('0038c00003MockContact1');
    expect(contactsRes.body.data[0].salesforceType).toBe('Contact');
  });

  it('should sync local contact outbound to Salesforce', async () => {
    vi.spyOn(sfClient, 'createSObject').mockResolvedValueOnce({
      id: '0038c00003OutboundContactId',
      success: true,
      errors: [],
    });

    // Create a local contact first
    const createContactRes = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Grace Hopper',
        phoneNumber: '+15558901234',
        email: 'grace@navy.gov',
        company: 'US Navy Tech',
      });

    const contactId = createContactRes.body.data.id;

    const syncRes = await request(app)
      .post(`/api/salesforce/contacts/${contactId}/sync`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(syncRes.status).toBe(200);
    expect(syncRes.body.success).toBe(true);
    expect(syncRes.body.data.salesforceId).toBe('0038c00003OutboundContactId');
  });

  it('should log a WhatsApp message to Salesforce as a Task/Activity', async () => {
    vi.spyOn(sfClient, 'createSObject').mockImplementation(async (sobject: string) => {
      if (sobject === 'Task') {
        return { id: '07T8c00000MockTaskId', success: true, errors: [] };
      }
      return { id: '0038c00003MockContactId', success: true, errors: [] };
    });
    vi.spyOn(sfClient, 'updateSObject').mockResolvedValue({
      id: '0038c00003MockContactId',
      success: true,
      errors: [],
    });

    // Find a message to sync
    const convRes = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${adminToken}`);

    const convId = convRes.body.data[0].id;
    const convDetails = await request(app)
      .get(`/api/conversations/${convId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const message = convDetails.body.data.messages[0];

    const taskSyncRes = await request(app)
      .post(`/api/salesforce/messages/${message.id}/sync`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(taskSyncRes.status).toBe(200);
    expect(taskSyncRes.body.success).toBe(true);
    expect(taskSyncRes.body.data.taskId).toBe('07T8c00000MockTaskId');
  });

  it('should manage custom field mappings (CRUD + Reset)', async () => {
    // List mappings
    const listRes = await request(app)
      .get('/api/salesforce/mappings')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.count).toBeGreaterThan(0);

    // Create custom mapping
    const createRes = await request(app)
      .post('/api/salesforce/mappings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        entityType: 'Contact',
        localField: 'custom_tier',
        salesforceField: 'Customer_Tier__c',
        direction: 'BIDIRECTIONAL',
        isActive: true,
      });

    expect(createRes.status).toBe(201);
    const newMappingId = createRes.body.data.id;

    // Toggle / Update mapping
    const updateRes = await request(app)
      .patch(`/api/salesforce/mappings/${newMappingId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.isActive).toBe(false);

    // Delete custom mapping
    const delRes = await request(app)
      .delete(`/api/salesforce/mappings/${newMappingId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.status).toBe(200);
  });

  it('should process inbound Salesforce webhook / change data capture events', async () => {
    vi.spyOn(sfClient, 'query').mockResolvedValue({
      totalSize: 0,
      done: true,
      records: [],
    });

    const webhookRes = await request(app)
      .post('/api/salesforce/webhook')
      .send({
        event_type: 'ContactChangeEvent',
        sobject: 'Contact',
        record: {
          Id: '0038c00003WebhookContact',
          LastName: 'WebhookUser',
          Phone: '+15559998888',
        },
      });

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.success).toBe(true);
  });

  it('should disconnect Salesforce integration', async () => {
    const disconnectRes = await request(app)
      .post('/api/salesforce/disconnect')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(disconnectRes.status).toBe(200);
    expect(disconnectRes.body.success).toBe(true);

    const statusRes = await request(app).get('/api/salesforce/status');
    expect(statusRes.body.data.integration.status).toBe('DISCONNECTED');
  });
});
