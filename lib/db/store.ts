import bcrypt from 'bcryptjs';
import {
  User,
  Contact,
  Conversation,
  Message,
  InternalNote,
  WebhookEvent,
  AuditLog,
  Role,
  ConversationStatus,
  MessageStatus,
  MessageDirection,
  SalesforceIntegration,
  SalesforceSyncLog,
  SalesforceFieldMapping,
} from './types';

class MemoryStore {
  private users: Map<string, User> = new Map();
  private contacts: Map<string, Contact> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message> = new Map();
  private internalNotes: Map<string, InternalNote> = new Map();
  private webhookEvents: Map<string, WebhookEvent> = new Map();
  private auditLogs: AuditLog[] = [];
  private salesforceIntegration: SalesforceIntegration | null = null;
  private salesforceSyncLogs: SalesforceSyncLog[] = [];
  private salesforceFieldMappings: Map<string, SalesforceFieldMapping> = new Map();
  private initialized = false;

  constructor() {
    this.init();
  }

  public async init() {
    if (this.initialized) return;
    this.initialized = true;

    // Default seeded passwords hashed with bcrypt
    const adminPasswordHash = bcrypt.hashSync('AdminPassword123!', 10);
    const agentPasswordHash = bcrypt.hashSync('AgentPassword123!', 10);

    const adminUser: User = {
      id: 'usr-admin-001',
      email: 'admin@enterprise-whatsapp.io',
      passwordHash: adminPasswordHash,
      name: 'Alexander Wright',
      role: 'ADMIN',
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const agent1: User = {
      id: 'usr-agent-001',
      email: 'agent.sarah@enterprise-whatsapp.io',
      passwordHash: agentPasswordHash,
      name: 'Sarah Connor',
      role: 'AGENT',
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const agent2: User = {
      id: 'usr-agent-002',
      email: 'agent.david@enterprise-whatsapp.io',
      passwordHash: agentPasswordHash,
      name: 'David Miller',
      role: 'AGENT',
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(agent1.id, agent1);
    this.users.set(agent2.id, agent2);

    const contact1: Contact = {
      id: 'cnt-001',
      phoneNumber: '+15550192834',
      name: 'Elena Rostova',
      email: 'elena.rostova@fintechglobal.com',
      company: 'FinTech Global Ltd',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      tags: ['VIP', 'Enterprise', 'Billing'],
      notes: 'Key decision maker for EMEA enterprise roll-out. Highly prefers WhatsApp updates.',
      lastInteraction: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    };

    const contact2: Contact = {
      id: 'cnt-002',
      phoneNumber: '+15550284759',
      name: 'Marcus Vance',
      email: 'marcus.v@cloudscale.net',
      company: 'CloudScale Infrastructure',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      tags: ['Technical', 'SLA-1hr', 'API'],
      notes: 'Inquiring regarding Cloud API throughput and webhook redundancy setup.',
      lastInteraction: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    };

    const contact3: Contact = {
      id: 'cnt-003',
      phoneNumber: '+15550938172',
      name: 'Amara Okafor',
      email: 'amara.o@apexlogistics.io',
      company: 'Apex Logistics Corp',
      avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150',
      tags: ['Logistics', 'Templates', 'Resolved'],
      notes: 'Assisted with tracking status dispatch templates on WhatsApp Cloud API.',
      lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    };

    const contact4: Contact = {
      id: 'cnt-004',
      phoneNumber: '+15550472918',
      name: 'Kenji Sato',
      email: 'k.sato@tokyotech.jp',
      company: 'TokyoTech Robotics',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      tags: ['Trial', 'Self-Serve'],
      notes: 'Exploring WhatsApp chatbot integration and catalog messages.',
      lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    };

    this.contacts.set(contact1.id, contact1);
    this.contacts.set(contact2.id, contact2);
    this.contacts.set(contact3.id, contact3);
    this.contacts.set(contact4.id, contact4);

    const conv1: Conversation = {
      id: 'conv-001',
      contactId: contact1.id,
      assignedAgentId: agent1.id,
      status: 'OPEN',
      priority: 'HIGH',
      subject: 'Enterprise WhatsApp Cloud API throughput & pricing inquiry',
      unreadCount: 1,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    };

    const conv2: Conversation = {
      id: 'conv-002',
      contactId: contact2.id,
      assignedAgentId: agent2.id,
      status: 'PENDING',
      priority: 'MEDIUM',
      subject: 'Webhook endpoint signature verification guidance',
      unreadCount: 0,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    };

    const conv3: Conversation = {
      id: 'conv-003',
      contactId: contact3.id,
      assignedAgentId: agent1.id,
      status: 'RESOLVED',
      priority: 'LOW',
      subject: 'Custom template approval confirmation for delivery notifications',
      unreadCount: 0,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    };

    this.conversations.set(conv1.id, conv1);
    this.conversations.set(conv2.id, conv2);
    this.conversations.set(conv3.id, conv3);

    const msgs: Message[] = [
      {
        id: 'msg-001',
        conversationId: conv1.id,
        whatsappMessageId: 'wamid.HBgLMTU1NTAxOTI4MzQVAgASGBQzQjE2RkYyNTA5',
        direction: 'INBOUND',
        type: 'TEXT',
        body: 'Hello! We are migrating from Twilio to Meta WhatsApp Cloud API and need to confirm if your platform supports tier 3 throughput (100k messages/day).',
        status: 'READ',
        senderPhone: contact1.phoneNumber,
        recipientPhone: '+15551234567',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      },
      {
        id: 'msg-002',
        conversationId: conv1.id,
        whatsappMessageId: 'wamid.HBgLMTU1NTAxOTI4MzQVAgACGBQ0NzJBMTU5OTA5',
        direction: 'OUTBOUND',
        type: 'TEXT',
        body: 'Hi Elena! Yes, our architecture directly interfaces with Meta WhatsApp Cloud API with horizontal rate-limit queues, seamlessly managing Tier 3 and Unlimited message tiers.',
        status: 'READ',
        senderPhone: '+15551234567',
        recipientPhone: contact1.phoneNumber,
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
      {
        id: 'msg-003',
        conversationId: conv1.id,
        whatsappMessageId: 'wamid.HBgLMTU1NTAxOTI4MzQVAgASGBQ4MkU3QTkxMTA5',
        direction: 'INBOUND',
        type: 'TEXT',
        body: 'That sounds ideal. Can we schedule a brief technical review of the webhook payload handling and agent inbox?',
        status: 'DELIVERED',
        senderPhone: contact1.phoneNumber,
        recipientPhone: '+15551234567',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
      {
        id: 'msg-004',
        conversationId: conv2.id,
        whatsappMessageId: 'wamid.HBgLMTU1NTAyODQ3NTkVAgASGBQ1ODFFRTgyODA5',
        direction: 'INBOUND',
        type: 'TEXT',
        body: 'Question regarding x-hub-signature-256 header validation in the webhook endpoint. Do you use raw body buffers?',
        status: 'READ',
        senderPhone: contact2.phoneNumber,
        recipientPhone: '+15551234567',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
      {
        id: 'msg-005',
        conversationId: conv2.id,
        whatsappMessageId: 'wamid.HBgLMTU1NTAyODQ3NTkVAgACGBQ3OTFCRDM4OTA5',
        direction: 'OUTBOUND',
        type: 'TEXT',
        body: 'Yes, exactly. We verify the HMAC SHA-256 hash using crypto.createHmac against the raw request buffer with META_APP_SECRET.',
        status: 'DELIVERED',
        senderPhone: '+15551234567',
        recipientPhone: contact2.phoneNumber,
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    ];

    msgs.forEach((m) => this.messages.set(m.id, m));

    const note1: InternalNote = {
      id: 'note-001',
      conversationId: conv1.id,
      userId: adminUser.id,
      content: 'Elena mentioned their procurement team is ready to approve once the security architecture doc is verified.',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    };

    const note2: InternalNote = {
      id: 'note-002',
      conversationId: conv2.id,
      userId: agent2.id,
      content: 'Sent code snippet for Node.js Express raw body verification middleware.',
      createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    };

    this.internalNotes.set(note1.id, note1);
    this.internalNotes.set(note2.id, note2);

    this.auditLogs.push(
      {
        id: 'audit-001',
        userId: adminUser.id,
        action: 'USER_LOGIN',
        resource: 'User',
        resourceId: adminUser.id,
        details: { method: 'PASSWORD', email: adminUser.email },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
      {
        id: 'audit-002',
        userId: adminUser.id,
        action: 'CONVERSATION_ASSIGN',
        resource: 'Conversation',
        resourceId: conv1.id,
        details: { assignedTo: agent1.name, conversationSubject: conv1.subject },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: 'audit-003',
        userId: agent1.id,
        action: 'MESSAGE_SEND',
        resource: 'Message',
        resourceId: 'msg-002',
        details: { recipient: contact1.phoneNumber, type: 'TEXT' },
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
      {
        id: 'audit-004',
        userId: null,
        action: 'WEBHOOK_PROCESSED',
        resource: 'WebhookEvent',
        resourceId: 'evt-meta-001',
        details: { eventType: 'messages', sender: contact1.phoneNumber, status: 'SUCCESS' },
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      }
    );

    // Initialize Default Salesforce Field Mappings
    this.seedDefaultFieldMappings();
  }

  private seedDefaultFieldMappings() {
    const defaultMappings: Omit<SalesforceFieldMapping, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        entityType: 'Contact',
        localField: 'name',
        salesforceField: 'LastName',
        direction: 'BIDIRECTIONAL',
        isActive: true,
      },
      {
        entityType: 'Contact',
        localField: 'phoneNumber',
        salesforceField: 'Phone',
        direction: 'BIDIRECTIONAL',
        isActive: true,
      },
      {
        entityType: 'Contact',
        localField: 'email',
        salesforceField: 'Email',
        direction: 'BIDIRECTIONAL',
        isActive: true,
      },
      {
        entityType: 'Contact',
        localField: 'company',
        salesforceField: 'Department',
        direction: 'BIDIRECTIONAL',
        isActive: true,
      },
      {
        entityType: 'Contact',
        localField: 'notes',
        salesforceField: 'Description',
        direction: 'BIDIRECTIONAL',
        isActive: true,
      },
      {
        entityType: 'Lead',
        localField: 'name',
        salesforceField: 'LastName',
        direction: 'BIDIRECTIONAL',
        isActive: true,
      },
      {
        entityType: 'Lead',
        localField: 'phoneNumber',
        salesforceField: 'Phone',
        direction: 'BIDIRECTIONAL',
        isActive: true,
      },
      {
        entityType: 'Lead',
        localField: 'email',
        salesforceField: 'Email',
        direction: 'BIDIRECTIONAL',
        isActive: true,
      },
      {
        entityType: 'Lead',
        localField: 'company',
        salesforceField: 'Company',
        direction: 'BIDIRECTIONAL',
        isActive: true,
      },
      {
        entityType: 'Lead',
        localField: 'notes',
        salesforceField: 'Description',
        direction: 'BIDIRECTIONAL',
        isActive: true,
      },
    ];

    defaultMappings.forEach((m, idx) => {
      const id = `sf-map-${idx + 1}`;
      this.salesforceFieldMappings.set(id, {
        ...m,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  }

  // --- Users ---
  public async findUserByEmail(email: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    return user || null;
  }

  public async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  public async getAllUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    return Array.from(this.users.values())
      .map(({ passwordHash: _p, ...u }) => u)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
    role?: Role;
    avatarUrl?: string | null;
  }): Promise<User> {
    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      name: data.name,
      role: data.role || 'AGENT',
      status: 'ACTIVE',
      avatarUrl: data.avatarUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  public async updateUser(
    id: string,
    updates: Partial<Omit<User, 'id' | 'createdAt'>>
  ): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    const updated: User = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updated);
    return updated;
  }

  public async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // --- Contacts ---
  public async getAllContacts(query?: { search?: string; tag?: string }): Promise<Contact[]> {
    let list = Array.from(this.contacts.values());
    if (query?.search) {
      const s = query.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.phoneNumber.includes(s) ||
          (c.email && c.email.toLowerCase().includes(s)) ||
          (c.company && c.company.toLowerCase().includes(s))
      );
    }
    if (query?.tag) {
      list = list.filter((c) => c.tags.includes(query.tag!));
    }
    return list.sort(
      (a, b) => new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime()
    );
  }

  public async findContactById(id: string): Promise<Contact | null> {
    return this.contacts.get(id) || null;
  }

  public async findContactByPhone(phoneNumber: string): Promise<Contact | null> {
    // Normalize phone number (strip whitespace and common delimiters)
    const norm = phoneNumber.replace(/[\s\-()]/g, '');
    for (const contact of this.contacts.values()) {
      if (contact.phoneNumber.replace(/[\s\-()]/g, '') === norm) {
        return contact;
      }
    }
    return null;
  }

  public async findContactByEmail(email: string): Promise<Contact | null> {
    const e = email.toLowerCase().trim();
    for (const contact of this.contacts.values()) {
      if (contact.email && contact.email.toLowerCase().trim() === e) {
        return contact;
      }
    }
    return null;
  }

  public async findContactBySalesforceId(sfId: string): Promise<Contact | null> {
    for (const contact of this.contacts.values()) {
      if (contact.salesforceId === sfId) {
        return contact;
      }
    }
    return null;
  }

  /**
   * Comprehensive Duplicate Detection & Matching Engine:
   * 1. Match by exact Salesforce ID
   * 2. Match by normalized phone number (E.164 stripped)
   * 3. Match by email address (case-insensitive)
   * 4. Match by exact name + company combination
   */
  public async findMatchingContact(criteria: {
    salesforceId?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    name?: string | null;
    company?: string | null;
  }): Promise<{ contact: Contact; matchReason: 'SALESFORCE_ID' | 'PHONE' | 'EMAIL' | 'NAME_COMPANY' } | null> {
    if (criteria.salesforceId) {
      const match = await this.findContactBySalesforceId(criteria.salesforceId);
      if (match) return { contact: match, matchReason: 'SALESFORCE_ID' };
    }

    if (criteria.phoneNumber) {
      const match = await this.findContactByPhone(criteria.phoneNumber);
      if (match) return { contact: match, matchReason: 'PHONE' };
    }

    if (criteria.email) {
      const match = await this.findContactByEmail(criteria.email);
      if (match) return { contact: match, matchReason: 'EMAIL' };
    }

    if (criteria.name && criteria.company) {
      const n = criteria.name.toLowerCase().trim();
      const comp = criteria.company.toLowerCase().trim();
      for (const contact of this.contacts.values()) {
        if (
          contact.name.toLowerCase().trim() === n &&
          contact.company &&
          contact.company.toLowerCase().trim() === comp
        ) {
          return { contact, matchReason: 'NAME_COMPANY' };
        }
      }
    }

    return null;
  }

  public async createContact(data: {
    phoneNumber: string;
    name: string;
    email?: string | null;
    company?: string | null;
    tags?: string[];
    notes?: string | null;
    avatarUrl?: string | null;
    salesforceId?: string | null;
    salesforceType?: 'Contact' | 'Lead' | null;
    salesforceSyncAt?: string | null;
  }): Promise<Contact> {
    const contact: Contact = {
      id: `cnt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      phoneNumber: data.phoneNumber,
      name: data.name,
      email: data.email || null,
      company: data.company || null,
      tags: data.tags || [],
      notes: data.notes || null,
      avatarUrl: data.avatarUrl || null,
      salesforceId: data.salesforceId || null,
      salesforceType: data.salesforceType || null,
      salesforceSyncAt: data.salesforceSyncAt || null,
      lastInteraction: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.contacts.set(contact.id, contact);
    return contact;
  }

  public async updateContact(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    const contact = this.contacts.get(id);
    if (!contact) return null;
    const updated: Contact = {
      ...contact,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.contacts.set(id, updated);
    return updated;
  }

  public async deleteContact(id: string): Promise<boolean> {
    return this.contacts.delete(id);
  }

  // --- Conversations ---
  public async getAllConversations(query?: {
    status?: ConversationStatus;
    assignedAgentId?: string;
    unreadOnly?: boolean;
    search?: string;
  }): Promise<Conversation[]> {
    let list = Array.from(this.conversations.values()).map((conv) => {
      const contact = this.contacts.get(conv.contactId);
      const agent = conv.assignedAgentId ? this.users.get(conv.assignedAgentId) : null;
      return {
        ...conv,
        contact,
        assignedAgent: agent ? (({ passwordHash: _p, ...a }) => a)(agent) : null,
      };
    });

    if (query?.status) {
      list = list.filter((c) => c.status === query.status);
    }
    if (query?.assignedAgentId) {
      list = list.filter((c) => c.assignedAgentId === query.assignedAgentId);
    }
    if (query?.unreadOnly) {
      list = list.filter((c) => c.unreadCount > 0);
    }
    if (query?.search) {
      const s = query.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.contact?.name.toLowerCase().includes(s) ||
          c.contact?.phoneNumber.includes(s) ||
          (c.subject && c.subject.toLowerCase().includes(s))
      );
    }

    return list.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  public async findConversationById(id: string): Promise<Conversation | null> {
    const conv = this.conversations.get(id);
    if (!conv) return null;
    const contact = this.contacts.get(conv.contactId);
    const agent = conv.assignedAgentId ? this.users.get(conv.assignedAgentId) : null;
    return {
      ...conv,
      contact,
      assignedAgent: agent ? (({ passwordHash: _p, ...a }) => a)(agent) : null,
    };
  }

  public async findConversationByContactId(contactId: string): Promise<Conversation | null> {
    const conv = Array.from(this.conversations.values()).find(
      (c) => c.contactId === contactId && c.status !== 'CLOSED'
    );
    if (!conv) {
      // Find latest conversation even if closed
      const allForContact = Array.from(this.conversations.values())
        .filter((c) => c.contactId === contactId)
        .sort(
          (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
      if (allForContact.length > 0) {
        return this.findConversationById(allForContact[0].id);
      }
      return null;
    }
    return this.findConversationById(conv.id);
  }

  public async createConversation(data: {
    contactId: string;
    assignedAgentId?: string | null;
    subject?: string;
    priority?: Conversation['priority'];
  }): Promise<Conversation> {
    const conv: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      contactId: data.contactId,
      assignedAgentId: data.assignedAgentId || null,
      status: 'OPEN',
      priority: data.priority || 'MEDIUM',
      subject: data.subject || 'WhatsApp Inbound Conversation',
      unreadCount: 0,
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.conversations.set(conv.id, conv);
    return (await this.findConversationById(conv.id))!;
  }

  public async updateConversation(
    id: string,
    updates: Partial<Conversation>
  ): Promise<Conversation | null> {
    const conv = this.conversations.get(id);
    if (!conv) return null;
    const updated: Conversation = {
      ...conv,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.conversations.set(id, updated);
    return this.findConversationById(id);
  }

  // --- Messages ---
  public async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public async findMessageByWhatsappId(whatsappMessageId: string): Promise<Message | null> {
    return (
      Array.from(this.messages.values()).find(
        (m) => m.whatsappMessageId === whatsappMessageId
      ) || null
    );
  }

  public async createMessage(data: {
    conversationId: string;
    whatsappMessageId?: string | null;
    direction: MessageDirection;
    type?: Message['type'];
    body: string;
    status?: MessageStatus;
    senderPhone?: string | null;
    recipientPhone?: string | null;
    metadata?: Record<string, unknown> | null;
    errorMessage?: string | null;
  }): Promise<Message> {
    const msg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      conversationId: data.conversationId,
      whatsappMessageId: data.whatsappMessageId || null,
      direction: data.direction,
      type: data.type || 'TEXT',
      body: data.body,
      status: data.status || 'SENT',
      senderPhone: data.senderPhone || null,
      recipientPhone: data.recipientPhone || null,
      metadata: data.metadata || null,
      errorMessage: data.errorMessage || null,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.messages.set(msg.id, msg);

    // Update conversation lastMessageAt and unreadCount
    const conv = this.conversations.get(data.conversationId);
    if (conv) {
      const isUnread = data.direction === 'INBOUND';
      this.conversations.set(data.conversationId, {
        ...conv,
        lastMessageAt: msg.timestamp,
        unreadCount: isUnread ? conv.unreadCount + 1 : conv.unreadCount,
        updatedAt: new Date().toISOString(),
      });
    }

    return msg;
  }

  public async updateMessageStatus(
    whatsappMessageId: string,
    status: MessageStatus,
    errorMessage?: string
  ): Promise<Message | null> {
    const msg = await this.findMessageByWhatsappId(whatsappMessageId);
    if (!msg) return null;
    const updated: Message = {
      ...msg,
      status,
      errorMessage: errorMessage || msg.errorMessage,
      updatedAt: new Date().toISOString(),
    };
    this.messages.set(msg.id, updated);
    return updated;
  }

  public async findMessageById(id: string): Promise<Message | null> {
    return this.messages.get(id) || null;
  }

  public async updateMessage(id: string, updates: Partial<Message>): Promise<Message | null> {
    const msg = this.messages.get(id);
    if (!msg) return null;
    const updated: Message = {
      ...msg,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.messages.set(id, updated);
    return updated;
  }

  // --- Internal Notes ---
  public async getInternalNotesByConversationId(conversationId: string): Promise<InternalNote[]> {
    return Array.from(this.internalNotes.values())
      .filter((n) => n.conversationId === conversationId)
      .map((n) => {
        const user = this.users.get(n.userId);
        return {
          ...n,
          user: user ? (({ passwordHash: _p, ...u }) => u)(user) : undefined,
        };
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public async createInternalNote(data: {
    conversationId: string;
    userId: string;
    content: string;
  }): Promise<InternalNote> {
    const note: InternalNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      conversationId: data.conversationId,
      userId: data.userId,
      content: data.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.internalNotes.set(note.id, note);
    const user = this.users.get(data.userId);
    return {
      ...note,
      user: user ? (({ passwordHash: _p, ...u }) => u)(user) : undefined,
    };
  }

  // --- Webhook Events (Idempotency) ---
  public async findWebhookEvent(eventId: string): Promise<WebhookEvent | null> {
    return this.webhookEvents.get(eventId) || null;
  }

  public async recordWebhookEvent(data: {
    eventId: string;
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<WebhookEvent> {
    const event: WebhookEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      eventId: data.eventId,
      eventType: data.eventType,
      payload: data.payload,
      processed: false,
      receivedAt: new Date().toISOString(),
    };
    this.webhookEvents.set(event.eventId, event);
    return event;
  }

  public async markWebhookProcessed(eventId: string, error?: string): Promise<void> {
    const event = this.webhookEvents.get(eventId);
    if (event) {
      this.webhookEvents.set(eventId, {
        ...event,
        processed: !error,
        error: error || null,
        processedAt: new Date().toISOString(),
      });
    }
  }

  public async getAllWebhookEvents(limit = 20): Promise<WebhookEvent[]> {
    return Array.from(this.webhookEvents.values())
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
      .slice(0, limit);
  }

  // --- Audit Logs ---
  public async createAuditLog(data: {
    userId?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    details?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<AuditLog> {
    const user = data.userId ? this.users.get(data.userId) : null;
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: data.userId || null,
      user: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId || null,
      details: data.details || null,
      ipAddress: data.ipAddress || '127.0.0.1',
      userAgent: data.userAgent || 'Applet/1.0',
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return log;
  }

  public async getAuditLogs(limit = 50): Promise<AuditLog[]> {
    return this.auditLogs.slice(0, limit);
  }

  // --- Dashboard Statistics ---
  public async getDashboardStats(): Promise<{
    totalContacts: number;
    totalConversations: number;
    openConversations: number;
    pendingConversations: number;
    resolvedConversations: number;
    closedConversations: number;
    messagesReceived: number;
    messagesSent: number;
    unreadConversations: number;
    recentConversations: Conversation[];
    recentActivity: AuditLog[];
    dailyMessageTrends: { date: string; inbound: number; outbound: number }[];
  }> {
    const convs = Array.from(this.conversations.values());
    const msgs = Array.from(this.messages.values());

    const openCount = convs.filter((c) => c.status === 'OPEN').length;
    const pendingCount = convs.filter((c) => c.status === 'PENDING').length;
    const resolvedCount = convs.filter((c) => c.status === 'RESOLVED').length;
    const closedCount = convs.filter((c) => c.status === 'CLOSED').length;
    const unreadCount = convs.filter((c) => c.unreadCount > 0).length;

    const messagesReceived = msgs.filter((m) => m.direction === 'INBOUND').length;
    const messagesSent = msgs.filter((m) => m.direction === 'OUTBOUND').length;

    // Last 7 days trend calculations
    const dailyMessageTrends: { date: string; inbound: number; outbound: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayInbound = msgs.filter(
        (m) => m.direction === 'INBOUND' && m.createdAt.startsWith(dateStr)
      ).length;
      const dayOutbound = msgs.filter(
        (m) => m.direction === 'OUTBOUND' && m.createdAt.startsWith(dateStr)
      ).length;
      dailyMessageTrends.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        inbound: dayInbound,
        outbound: dayOutbound,
      });
    }

    const recentConversations = await this.getAllConversations();

    return {
      totalContacts: this.contacts.size,
      totalConversations: this.conversations.size,
      openConversations: openCount,
      pendingConversations: pendingCount,
      resolvedConversations: resolvedCount,
      closedConversations: closedCount,
      messagesReceived,
      messagesSent,
      unreadConversations: unreadCount,
      recentConversations: recentConversations.slice(0, 5),
      recentActivity: this.auditLogs.slice(0, 10),
      dailyMessageTrends,
    };
  }

  // --- Salesforce Integration Management ---
  public async getSalesforceIntegration(): Promise<SalesforceIntegration | null> {
    return this.salesforceIntegration;
  }

  public async saveSalesforceIntegration(
    data: Partial<SalesforceIntegration> & { instanceUrl: string; accessToken: string }
  ): Promise<SalesforceIntegration> {
    const existing = this.salesforceIntegration;
    const now = new Date().toISOString();

    const integration: SalesforceIntegration = {
      id: existing?.id || `sf-integ-${Date.now()}`,
      instanceUrl: data.instanceUrl.replace(/\/$/, ''),
      accessToken: data.accessToken,
      refreshToken: data.refreshToken !== undefined ? data.refreshToken : existing?.refreshToken || null,
      tokenType: data.tokenType || existing?.tokenType || 'Bearer',
      issuedAt: data.issuedAt || existing?.issuedAt || now,
      userId: data.userId !== undefined ? data.userId : existing?.userId || null,
      orgId: data.orgId !== undefined ? data.orgId : existing?.orgId || null,
      userEmail: data.userEmail !== undefined ? data.userEmail : existing?.userEmail || null,
      userName: data.userName !== undefined ? data.userName : existing?.userName || null,
      environment: data.environment || existing?.environment || 'production',
      clientId: data.clientId !== undefined ? data.clientId : existing?.clientId || null,
      clientSecret: data.clientSecret !== undefined ? data.clientSecret : existing?.clientSecret || null,
      autoSyncMessages:
        data.autoSyncMessages !== undefined ? data.autoSyncMessages : existing?.autoSyncMessages ?? true,
      autoSyncContacts:
        data.autoSyncContacts !== undefined ? data.autoSyncContacts : existing?.autoSyncContacts ?? true,
      targetObject: data.targetObject || existing?.targetObject || 'Contact',
      status: data.status || 'CONNECTED',
      lastSyncAt: data.lastSyncAt !== undefined ? data.lastSyncAt : existing?.lastSyncAt || null,
      lastError: data.lastError !== undefined ? data.lastError : null,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.salesforceIntegration = integration;
    return integration;
  }

  public async updateSalesforceStatus(
    status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR',
    error?: string | null
  ): Promise<SalesforceIntegration | null> {
    if (!this.salesforceIntegration) return null;
    this.salesforceIntegration = {
      ...this.salesforceIntegration,
      status,
      lastError: error !== undefined ? error : this.salesforceIntegration.lastError,
      updatedAt: new Date().toISOString(),
    };
    return this.salesforceIntegration;
  }

  public async disconnectSalesforce(): Promise<boolean> {
    if (!this.salesforceIntegration) return false;
    this.salesforceIntegration = {
      ...this.salesforceIntegration,
      status: 'DISCONNECTED',
      accessToken: '',
      refreshToken: null,
      lastError: null,
      updatedAt: new Date().toISOString(),
    };
    return true;
  }

  // --- Salesforce Sync Logs ---
  public async createSalesforceSyncLog(
    data: Omit<SalesforceSyncLog, 'id' | 'createdAt'>
  ): Promise<SalesforceSyncLog> {
    const log: SalesforceSyncLog = {
      id: `sf-log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.salesforceSyncLogs.unshift(log);
    if (this.salesforceSyncLogs.length > 200) {
      this.salesforceSyncLogs.pop();
    }
    return log;
  }

  public async getSalesforceSyncLogs(limit = 50): Promise<SalesforceSyncLog[]> {
    return this.salesforceSyncLogs.slice(0, limit);
  }

  public async clearSalesforceSyncLogs(): Promise<boolean> {
    this.salesforceSyncLogs = [];
    return true;
  }

  // --- Salesforce Field Mappings ---
  public async getFieldMappings(entityType?: 'Contact' | 'Lead'): Promise<SalesforceFieldMapping[]> {
    let list = Array.from(this.salesforceFieldMappings.values());
    if (entityType) {
      list = list.filter((m) => m.entityType === entityType);
    }
    return list;
  }

  public async createFieldMapping(
    data: Omit<SalesforceFieldMapping, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SalesforceFieldMapping> {
    const id = `sf-map-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const mapping: SalesforceFieldMapping = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.salesforceFieldMappings.set(id, mapping);
    return mapping;
  }

  public async updateFieldMapping(
    id: string,
    updates: Partial<Omit<SalesforceFieldMapping, 'id' | 'createdAt'>>
  ): Promise<SalesforceFieldMapping | null> {
    const mapping = this.salesforceFieldMappings.get(id);
    if (!mapping) return null;
    const updated: SalesforceFieldMapping = {
      ...mapping,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.salesforceFieldMappings.set(id, updated);
    return updated;
  }

  public async deleteFieldMapping(id: string): Promise<boolean> {
    return this.salesforceFieldMappings.delete(id);
  }

  public async resetDefaultFieldMappings(): Promise<SalesforceFieldMapping[]> {
    this.salesforceFieldMappings.clear();
    this.seedDefaultFieldMappings();
    return Array.from(this.salesforceFieldMappings.values());
  }
}

// Global singleton instance across Next.js / Express module reloads
const globalForStore = globalThis as unknown as { storeInstance?: MemoryStore };
export const dbStore = globalForStore.storeInstance ?? new MemoryStore();
if (process.env.NODE_ENV !== 'production') {
  globalForStore.storeInstance = dbStore;
}
