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
  salesforceId?: string | null;
  salesforceType?: 'Contact' | 'Lead' | null;
  salesforceSyncAt?: string | null;
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
  salesforceCaseId?: string | null;
  salesforceSyncAt?: string | null;
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
  salesforceTaskId?: string | null;
  salesforceSyncAt?: string | null;
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

export type SalesforceEnvironment = 'production' | 'sandbox';
export type SalesforceSyncDirection = 'OUTBOUND' | 'INBOUND' | 'BIDIRECTIONAL';
export type SalesforceSyncStatus = 'SUCCESS' | 'FAILED' | 'PARTIAL';
export type SalesforceTargetObject = 'Contact' | 'Lead' | 'Both';

export interface SalesforceIntegration {
  id: string;
  instanceUrl: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenType: string;
  issuedAt?: string | null;
  userId?: string | null;
  orgId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  environment: SalesforceEnvironment;
  clientId?: string | null;
  clientSecret?: string | null;
  autoSyncMessages: boolean;
  autoSyncContacts: boolean;
  targetObject: SalesforceTargetObject;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastSyncAt?: string | null;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalesforceSyncLog {
  id: string;
  direction: SalesforceSyncDirection;
  entityType: 'CONTACT' | 'LEAD' | 'MESSAGE' | 'CONVERSATION' | 'ALL';
  status: SalesforceSyncStatus;
  recordsProcessed: number;
  recordsSynced: number;
  recordsFailed: number;
  durationMs: number;
  error?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

export interface SalesforceFieldMapping {
  id: string;
  entityType: 'Contact' | 'Lead';
  localField: string;
  salesforceField: string;
  direction: 'LOCAL_TO_SF' | 'SF_TO_LOCAL' | 'BIDIRECTIONAL';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
