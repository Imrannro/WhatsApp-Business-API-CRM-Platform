export const apiClient = {
  async fetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return data;
  },

  // Auth
  async login(email: string, password: string) {
    const res = await this.fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async register(name: string, email: string, password: string, role: string) {
    const res = await this.fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async me() {
    return this.fetch('/api/auth/me');
  },

  async logout() {
    await this.fetch('/api/auth/me', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Conversations
  async getConversations(params: { status?: string; search?: string; all?: boolean } = {}) {
    const q = new URLSearchParams();
    if (params.status && params.status !== 'ALL') q.set('status', params.status);
    if (params.search) q.set('search', params.search);
    if (params.all) q.set('all', 'true');
    return this.fetch(`/api/conversations?${q.toString()}`);
  },

  async getConversation(id: string) {
    return this.fetch(`/api/conversations/${id}`);
  },

  async updateConversation(id: string, updates: Record<string, any>) {
    return this.fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async assignConversation(id: string, agentId: string) {
    return this.fetch(`/api/conversations/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ agentId }),
    });
  },

  async sendMessage(id: string, body: string, type: 'TEXT' | 'TEMPLATE' = 'TEXT', templateName?: string) {
    return this.fetch(`/api/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body, type, templateName }),
    });
  },

  async addNote(id: string, content: string) {
    return this.fetch(`/api/conversations/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  // Contacts
  async getContacts(search?: string, tag?: string) {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (tag) q.set('tag', tag);
    return this.fetch(`/api/contacts?${q.toString()}`);
  },

  async getContact(id: string) {
    return this.fetch(`/api/contacts/${id}`);
  },

  async createContact(data: any) {
    return this.fetch('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateContact(id: string, data: any) {
    return this.fetch(`/api/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteContact(id: string) {
    return this.fetch(`/api/contacts/${id}`, {
      method: 'DELETE',
    });
  },

  // Dashboard & Audit
  async getStats() {
    return this.fetch('/api/dashboard/stats');
  },

  async getAuditLogs() {
    return this.fetch('/api/dashboard/audit-logs');
  },

  // Users & Settings
  async getUsers() {
    return this.fetch('/api/users');
  },

  async createUser(data: any) {
    return this.fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateUser(id: string, data: any) {
    return this.fetch(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteUser(id: string) {
    return this.fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  async getWhatsAppSettings() {
    return this.fetch('/api/users/settings/whatsapp');
  },

  async toggleWhatsAppProvider(provider: 'meta' | 'mock') {
    return this.fetch('/api/users/settings/whatsapp-provider', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    });
  },

  // Webhooks & Simulator
  async simulateWebhook(data: any) {
    return this.fetch('/api/webhooks/whatsapp/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getWebhookEvents() {
    return this.fetch('/api/webhooks/whatsapp/events');
  },

  async verifyWebhook(token: string) {
    const challenge = 'test_challenge_' + Math.floor(Math.random() * 100000);
    const res = await fetch(
      `/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(
        token
      )}&hub.challenge=${challenge}`
    );
    const text = await res.text();
    return { status: res.status, ok: res.ok, body: text, challengeMatched: text === challenge };
  },

  // Salesforce CRM Integration
  async getSalesforceStatus() {
    return this.fetch('/api/salesforce/status');
  },

  async getSalesforceAuthUrl(clientId?: string, redirectUri?: string, environment?: string) {
    const q = new URLSearchParams();
    if (clientId) q.set('clientId', clientId);
    if (redirectUri) q.set('redirectUri', redirectUri);
    if (environment) q.set('environment', environment);
    return this.fetch(`/api/salesforce/auth-url?${q.toString()}`);
  },

  async handleSalesforceOAuthCallback(code: string, clientId?: string, clientSecret?: string, redirectUri?: string, environment?: string) {
    return this.fetch('/api/salesforce/oauth/callback', {
      method: 'POST',
      body: JSON.stringify({ code, clientId, clientSecret, redirectUri, environment }),
    });
  },

  async connectSalesforceDirect(data: {
    instanceUrl: string;
    accessToken: string;
    refreshToken?: string;
    environment?: 'production' | 'sandbox';
    clientId?: string;
    clientSecret?: string;
    targetObject?: 'Contact' | 'Lead' | 'Both';
    autoSyncMessages?: boolean;
    autoSyncContacts?: boolean;
  }) {
    return this.fetch('/api/salesforce/connect-direct', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async disconnectSalesforce() {
    return this.fetch('/api/salesforce/disconnect', {
      method: 'POST',
    });
  },

  async updateSalesforceSettings(data: {
    autoSyncMessages?: boolean;
    autoSyncContacts?: boolean;
    targetObject?: 'Contact' | 'Lead' | 'Both';
  }) {
    return this.fetch('/api/salesforce/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async triggerSalesforceSync(entityType: 'CONTACT' | 'LEAD' | 'ALL' = 'ALL') {
    return this.fetch('/api/salesforce/sync', {
      method: 'POST',
      body: JSON.stringify({ entityType }),
    });
  },

  async syncContactToSalesforce(contactId: string) {
    return this.fetch(`/api/salesforce/contacts/${contactId}/sync`, {
      method: 'POST',
    });
  },

  async syncMessageToSalesforce(messageId: string) {
    return this.fetch(`/api/salesforce/messages/${messageId}/sync`, {
      method: 'POST',
    });
  },

  async syncConversationToSalesforce(conversationId: string) {
    return this.fetch(`/api/salesforce/conversations/${conversationId}/sync`, {
      method: 'POST',
    });
  },

  async getSalesforceLogs(limit = 50) {
    return this.fetch(`/api/salesforce/logs?limit=${limit}`);
  },

  async clearSalesforceLogs() {
    return this.fetch('/api/salesforce/logs', {
      method: 'DELETE',
    });
  },

  async getSalesforceMappings(entityType?: 'Contact' | 'Lead') {
    const q = entityType ? `?entityType=${entityType}` : '';
    return this.fetch(`/api/salesforce/mappings${q}`);
  },

  async createSalesforceMapping(data: {
    entityType: 'Contact' | 'Lead';
    localField: string;
    salesforceField: string;
    direction?: 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';
    isActive?: boolean;
  }) {
    return this.fetch('/api/salesforce/mappings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSalesforceMapping(id: string, data: {
    salesforceField?: string;
    localField?: string;
    direction?: 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';
    isActive?: boolean;
  }) {
    return this.fetch(`/api/salesforce/mappings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteSalesforceMapping(id: string) {
    return this.fetch(`/api/salesforce/mappings/${id}`, {
      method: 'DELETE',
    });
  },

  async resetSalesforceMappings() {
    return this.fetch('/api/salesforce/mappings/reset', {
      method: 'POST',
    });
  },

  async describeSalesforceSObject(sobject: string) {
    return this.fetch(`/api/salesforce/describe/${sobject}`);
  },
};

