import {
  User,
  Contact,
  Conversation,
  Message,
  InternalNote,
  AuditLog,
  ConversationStatus,
  Priority,
  MessageStatus,
} from '@/lib/db/types';

export type {
  User,
  Contact,
  Conversation,
  Message,
  InternalNote,
  AuditLog,
  ConversationStatus,
  Priority,
  MessageStatus,
};

export type ActiveTab =
  | 'inbox'
  | 'dashboard'
  | 'contacts'
  | 'agents'
  | 'simulator'
  | 'settings'
  | 'audit-logs'
  | 'docs';

export interface DashboardStats {
  totalContacts: number;
  totalConversations: number;
  openConversations: number;
  pendingConversations: number;
  resolvedConversations: number;
  closedConversations: number;
  totalMessagesReceived: number;
  totalMessagesSent: number;
  unreadConversations: number;
}
