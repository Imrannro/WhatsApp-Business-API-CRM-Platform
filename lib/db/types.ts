export type Role = 'ADMIN' | 'AGENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'DOCUMENT'
  | 'AUDIO'
  | 'VIDEO'
  | 'TEMPLATE'
  | 'LOCATION'
  | 'INTERACTIVE';
export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
export type ConversationStatus = 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  phoneNumber: string;
  name: string;
  email?: string | null;
  company?: string | null;
  avatarUrl?: string | null;
  tags: string[];
  notes?: string | null;
  lastInteraction: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  contactId: string;
  contact?: Contact;
  assignedAgentId?: string | null;
  assignedAgent?: Omit<User, 'passwordHash'> | null;
  status: ConversationStatus;
  priority: Priority;
  subject?: string | null;
  unreadCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  whatsappMessageId?: string | null;
  direction: MessageDirection;
  type: MessageType;
  body: string;
  status: MessageStatus;
  senderPhone?: string | null;
  recipientPhone?: string | null;
  metadata?: Record<string, unknown> | null;
  errorMessage?: string | null;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationAssignment {
  id: string;
  conversationId: string;
  userId: string;
  assignedBy: string;
  assignedAt: string;
}

export interface InternalNote {
  id: string;
  conversationId: string;
  userId: string;
  user?: Omit<User, 'passwordHash'>;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  id: string;
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  processed: boolean;
  error?: string | null;
  receivedAt: string;
  processedAt?: string | null;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: { id: string; name: string; email: string; role: Role } | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface DashboardStats {
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
}
