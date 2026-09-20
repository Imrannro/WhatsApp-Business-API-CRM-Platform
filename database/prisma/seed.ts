import bcrypt from 'bcryptjs';

export async function getSeedData() {
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
  const agentPasswordHash = await bcrypt.hash('AgentPassword123!', 10);

  const users = [
    {
      id: 'usr-admin-001',
      email: 'admin@enterprise-whatsapp.io',
      passwordHash: adminPasswordHash,
      name: 'Alexander Wright',
      role: 'ADMIN',
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      createdAt: new Date('2025-01-01T08:00:00Z'),
      updatedAt: new Date('2025-01-01T08:00:00Z')
    },
    {
      id: 'usr-agent-001',
      email: 'agent.sarah@enterprise-whatsapp.io',
      passwordHash: agentPasswordHash,
      name: 'Sarah Connor',
      role: 'AGENT',
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      createdAt: new Date('2025-01-02T09:30:00Z'),
      updatedAt: new Date('2025-01-02T09:30:00Z')
    },
    {
      id: 'usr-agent-002',
      email: 'agent.david@enterprise-whatsapp.io',
      passwordHash: agentPasswordHash,
      name: 'David Miller',
      role: 'AGENT',
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      createdAt: new Date('2025-01-03T10:15:00Z'),
      updatedAt: new Date('2025-01-03T10:15:00Z')
    }
  ];

  const contacts = [
    {
      id: 'cnt-001',
      phoneNumber: '+15550192834',
      name: 'Elena Rostova',
      email: 'elena.rostova@fintechglobal.com',
      company: 'FinTech Global Ltd',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      tags: ['VIP', 'Enterprise', 'Billing'],
      notes: 'Key decision maker for EMEA enterprise roll-out. Highly prefers WhatsApp updates.',
      lastInteraction: new Date(Date.now() - 1000 * 60 * 12),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      updatedAt: new Date(Date.now() - 1000 * 60 * 12)
    },
    {
      id: 'cnt-002',
      phoneNumber: '+15550284759',
      name: 'Marcus Vance',
      email: 'marcus.v@cloudscale.net',
      company: 'CloudScale Infrastructure',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      tags: ['Technical', 'SLA-1hr', 'API'],
      notes: 'Inquiring regarding Cloud API throughput and webhook redundancy setup.',
      lastInteraction: new Date(Date.now() - 1000 * 60 * 45),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      updatedAt: new Date(Date.now() - 1000 * 60 * 45)
    },
    {
      id: 'cnt-003',
      phoneNumber: '+15550938172',
      name: 'Amara Okafor',
      email: 'amara.o@apexlogistics.io',
      company: 'Apex Logistics Corp',
      avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150',
      tags: ['Logistics', 'Templates', 'Resolved'],
      notes: 'Assisted with tracking status dispatch templates on WhatsApp Cloud API.',
      lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 4),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4)
    },
    {
      id: 'cnt-004',
      phoneNumber: '+15550472918',
      name: 'Kenji Sato',
      email: 'k.sato@tokyotech.jp',
      company: 'TokyoTech Robotics',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      tags: ['Trial', 'Self-Serve'],
      notes: 'Exploring WhatsApp chatbot integration and catalog messages.',
      lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 26),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26)
    }
  ];

  const conversations = [
    {
      id: 'conv-001',
      contactId: 'cnt-001',
      assignedAgentId: 'usr-agent-001',
      status: 'OPEN',
      priority: 'HIGH',
      subject: 'Inquiry regarding Enterprise WhatsApp Cloud API throughput & pricing',
      unreadCount: 1,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 12),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4)
    },
    {
      id: 'conv-002',
      contactId: 'cnt-002',
      assignedAgentId: 'usr-agent-002',
      status: 'PENDING',
      priority: 'MEDIUM',
      subject: 'Webhook endpoint signature verification guidance',
      unreadCount: 0,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 45),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18)
    },
    {
      id: 'conv-003',
      contactId: 'cnt-003',
      assignedAgentId: 'usr-agent-001',
      status: 'RESOLVED',
      priority: 'LOW',
      subject: 'Custom template approval confirmation for delivery notifications',
      unreadCount: 0,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48)
    }
  ];

  const messages = [
    {
      id: 'msg-001',
      conversationId: 'conv-001',
      whatsappMessageId: 'wamid.HBgLMTU1NTAxOTI4MzQVAgASGBQzQjE2RkYyNTA5',
      direction: 'INBOUND',
      type: 'TEXT',
      body: 'Hello! We are migrating from Twilio to Meta WhatsApp Cloud API and need to confirm if your platform supports tier 3 throughput (100k messages/day).',
      status: 'READ',
      senderPhone: '+15550192834',
      recipientPhone: '+15551234567',
      timestamp: new Date(Date.now() - 1000 * 60 * 35),
      createdAt: new Date(Date.now() - 1000 * 60 * 35)
    },
    {
      id: 'msg-002',
      conversationId: 'conv-001',
      whatsappMessageId: 'wamid.HBgLMTU1NTAxOTI4MzQVAgACGBQ0NzJBMTU5OTA5',
      direction: 'OUTBOUND',
      type: 'TEXT',
      body: 'Hi Elena! Yes, our architecture directly interfaces with Meta WhatsApp Cloud API with horizontal rate-limit queues, seamlessly managing Tier 3 and Unlimited message tiers.',
      status: 'READ',
      senderPhone: '+15551234567',
      recipientPhone: '+15550192834',
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
      createdAt: new Date(Date.now() - 1000 * 60 * 25)
    },
    {
      id: 'msg-003',
      conversationId: 'conv-001',
      whatsappMessageId: 'wamid.HBgLMTU1NTAxOTI4MzQVAgASGBQ4MkU3QTkxMTA5',
      direction: 'INBOUND',
      type: 'TEXT',
      body: 'That sounds ideal. Can we schedule a brief technical review of the webhook payload handling and agent inbox?',
      status: 'DELIVERED',
      senderPhone: '+15550192834',
      recipientPhone: '+15551234567',
      timestamp: new Date(Date.now() - 1000 * 60 * 12),
      createdAt: new Date(Date.now() - 1000 * 60 * 12)
    },
    {
      id: 'msg-004',
      conversationId: 'conv-002',
      whatsappMessageId: 'wamid.HBgLMTU1NTAyODQ3NTkVAgASGBQ1ODFFRTgyODA5',
      direction: 'INBOUND',
      type: 'TEXT',
      body: 'Question regarding x-hub-signature-256 header validation in the webhook endpoint. Do you use raw body buffers?',
      status: 'READ',
      senderPhone: '+15550284759',
      recipientPhone: '+15551234567',
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
      createdAt: new Date(Date.now() - 1000 * 60 * 120)
    },
    {
      id: 'msg-005',
      conversationId: 'conv-002',
      whatsappMessageId: 'wamid.HBgLMTU1NTAyODQ3NTkVAgACGBQ3OTFCRDM4OTA5',
      direction: 'OUTBOUND',
      type: 'TEXT',
      body: 'Yes, exactly. We verify the HMAC SHA-256 hash using crypto.createHmac against the raw request buffer with META_APP_SECRET.',
      status: 'DELIVERED',
      senderPhone: '+15551234567',
      recipientPhone: '+15550284759',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      createdAt: new Date(Date.now() - 1000 * 60 * 45)
    }
  ];

  const internalNotes = [
    {
      id: 'note-001',
      conversationId: 'conv-001',
      userId: 'usr-admin-001',
      content: 'Elena mentioned their procurement team is ready to approve once the security architecture doc is verified.',
      createdAt: new Date(Date.now() - 1000 * 60 * 20),
      updatedAt: new Date(Date.now() - 1000 * 60 * 20)
    },
    {
      id: 'note-002',
      conversationId: 'conv-002',
      userId: 'usr-agent-002',
      content: 'Sent code snippet for Node.js Express raw body verification middleware.',
      createdAt: new Date(Date.now() - 1000 * 60 * 40),
      updatedAt: new Date(Date.now() - 1000 * 60 * 40)
    }
  ];

  const auditLogs = [
    {
      id: 'audit-001',
      userId: 'usr-admin-001',
      action: 'USER_LOGIN',
      resource: 'User',
      resourceId: 'usr-admin-001',
      details: { method: 'PASSWORD', ip: '192.168.1.1' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3)
    },
    {
      id: 'audit-002',
      userId: 'usr-admin-001',
      action: 'CONVERSATION_ASSIGN',
      resource: 'Conversation',
      resourceId: 'conv-001',
      details: { assignedTo: 'usr-agent-001', previousAgent: null },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    {
      id: 'audit-003',
      userId: 'usr-agent-001',
      action: 'MESSAGE_SEND',
      resource: 'Message',
      resourceId: 'msg-002',
      details: { recipient: '+15550192834', type: 'TEXT' },
      createdAt: new Date(Date.now() - 1000 * 60 * 25)
    },
    {
      id: 'audit-004',
      userId: null,
      action: 'WEBHOOK_PROCESSED',
      resource: 'WebhookEvent',
      resourceId: 'evt-meta-001',
      details: { eventType: 'messages', sender: '+15550192834', status: 'SUCCESS' },
      createdAt: new Date(Date.now() - 1000 * 60 * 12)
    }
  ];

  return { users, contacts, conversations, messages, internalNotes, auditLogs };
}
