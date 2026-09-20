'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Check,
  CheckCheck,
  AlertCircle,
  Clock,
  Send,
  Lock,
  MessageSquare,
  User as UserIcon,
  Tag,
  Building,
  Mail,
  Phone,
  Sparkles,
  Bookmark,
  FileText,
  ChevronDown,
  RefreshCw,
  Plus,
  X,
  Shield,
  HelpCircle,
} from 'lucide-react';
import {
  Conversation,
  Message,
  InternalNote,
  User,
  Contact,
  ConversationStatus,
  Priority,
} from './types';
import { apiClient } from './apiClient';

interface InboxViewProps {
  currentUser: User;
  onRefreshStats: () => void;
}

export const InboxView: React.FC<InboxViewProps> = ({ currentUser, onRefreshStats }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [agents, setAgents] = useState<User[]>([]);

  // Filters & State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [messageMode, setMessageMode] = useState<'WHATSAPP' | 'NOTE'>('WHATSAPP');
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSimulatingReply, setIsSimulatingReply] = useState<boolean>(false);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [showTemplatePicker, setShowTemplatePicker] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load conversations
  const loadConversations = async (preserveActiveId = true) => {
    try {
      const res = await apiClient.getConversations({
        status: statusFilter,
        search: searchQuery,
        all: true,
      });
      if (res.data) {
        setConversations(res.data);
        if (!activeConversationId && res.data.length > 0) {
          setActiveConversationId(res.data[0].id);
        } else if (activeConversationId && !preserveActiveId) {
          setActiveConversationId(res.data[0]?.id || null);
        }
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load agents for assignment
  useEffect(() => {
    apiClient
      .getUsers()
      .then((res) => {
        if (res.data) setAgents(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    loadConversations();
  }, [statusFilter, searchQuery]);

  // Load active conversation details
  const loadActiveConversationDetails = async (id: string) => {
    try {
      const res = await apiClient.getConversation(id);
      if (res.data) {
        setActiveConversation(res.data.conversation);
        setMessages(res.data.messages || []);
        setInternalNotes(res.data.internalNotes || []);
      }
    } catch (err) {
      console.error('Error loading conversation details:', err);
    }
  };

  useEffect(() => {
    if (activeConversationId) {
      loadActiveConversationDetails(activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, internalNotes]);

  // Send message or internal note
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversationId || isSending) return;

    setIsSending(true);
    try {
      if (messageMode === 'WHATSAPP') {
        const res = await apiClient.sendMessage(activeConversationId, inputText.trim(), 'TEXT');
        if (res.data) {
          setMessages((prev) => [...prev, res.data]);
        }
      } else {
        const res = await apiClient.addNote(activeConversationId, inputText.trim());
        if (res.data) {
          setInternalNotes((prev) => [...prev, res.data]);
        }
      }
      setInputText('');
      loadConversations();
      onRefreshStats();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setIsSending(false);
    }
  };

  // Send WhatsApp Template
  const handleSendTemplate = async (templateName: string, previewText: string) => {
    if (!activeConversationId) return;
    setIsSending(true);
    setShowTemplatePicker(false);
    try {
      const res = await apiClient.sendMessage(
        activeConversationId,
        previewText,
        'TEMPLATE',
        templateName
      );
      if (res.data) {
        setMessages((prev) => [...prev, res.data]);
        loadConversations();
        onRefreshStats();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to send template');
    } finally {
      setIsSending(false);
    }
  };

  // Fast Simulate Customer WhatsApp Reply
  const handleSimulateCustomerReply = async () => {
    if (!activeConversation?.contact) return;
    setIsSimulatingReply(true);

    const replies = [
      'Thank you for confirming! Could you send me the tracking link as well?',
      'Yes, that solution worked perfectly. Appreciate the quick response!',
      'Understood. Please go ahead and schedule that for tomorrow afternoon.',
      'Got it, I reviewed the invoice details and everything looks accurate now.',
    ];
    const randomReply = replies[Math.floor(Math.random() * replies.length)];

    try {
      await apiClient.simulateWebhook({
        phoneNumber: activeConversation.contact.phoneNumber,
        name: activeConversation.contact.name,
        text: randomReply,
      });

      // Reload conversation messages and list
      await loadActiveConversationDetails(activeConversation.id);
      await loadConversations();
      onRefreshStats();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Simulation error');
    } finally {
      setIsSimulatingReply(false);
    }
  };

  // Change conversation status
  const handleStatusChange = async (newStatus: ConversationStatus) => {
    if (!activeConversationId) return;
    try {
      await apiClient.updateConversation(activeConversationId, { status: newStatus });
      setActiveConversation((prev) => (prev ? { ...prev, status: newStatus } : null));
      loadConversations();
      onRefreshStats();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  // Reassign agent
  const handleAssignAgent = async (agentId: string) => {
    if (!activeConversationId) return;
    try {
      await apiClient.assignConversation(activeConversationId, agentId);
      setActiveConversation((prev) =>
        prev
          ? {
              ...prev,
              assignedAgentId: agentId || null,
              assignedAgent: agents.find((a) => a.id === agentId) || null,
            }
          : null
      );
      loadConversations();
      onRefreshStats();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to assign agent');
    }
  };

  // Add tag to contact
  const handleAddTag = async () => {
    if (!newTagInput.trim() || !activeConversation?.contact) return;
    const currentTags = activeConversation.contact.tags || [];
    if (currentTags.includes(newTagInput.trim())) return;

    const updatedTags = [...currentTags, newTagInput.trim()];
    try {
      await apiClient.updateContact(activeConversation.contact.id, { tags: updatedTags });
      setActiveConversation((prev) =>
        prev && prev.contact ? { ...prev, contact: { ...prev.contact, tags: updatedTags } } : null
      );
      setNewTagInput('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating tags');
    }
  };

  // Remove tag from contact
  const handleRemoveTag = async (tagToRemove: string) => {
    if (!activeConversation?.contact) return;
    const updatedTags = (activeConversation.contact.tags || []).filter((t) => t !== tagToRemove);
    try {
      await apiClient.updateContact(activeConversation.contact.id, { tags: updatedTags });
      setActiveConversation((prev) =>
        prev && prev.contact ? { ...prev, contact: { ...prev.contact, tags: updatedTags } } : null
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error removing tag');
    }
  };

  // Combine messages and internal notes sorted chronologically
  const unifiedStream = [
    ...messages.map((m) => ({ ...m, streamType: 'MESSAGE' as const })),
    ...internalNotes.map((n) => ({ ...n, streamType: 'NOTE' as const })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-100">
      {/* ========================================================================= */}
      {/* 1. LEFT PANEL: Conversations List */}
      {/* ========================================================================= */}
      <div className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0">
        {/* Search & Header */}
        <div className="p-3 border-b border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Inbox Triage</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                {conversations.length}
              </span>
            </h2>
            <button
              onClick={() => loadConversations()}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              title="Refresh conversations"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by contact or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Status filter chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-medium no-scrollbar">
            {['ALL', 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                  statusFilter === s
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading inbox tickets...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No conversations found under {statusFilter} filter.
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = conv.id === activeConversationId;
              const contactName = conv.contact?.name || 'Customer';
              const phone = conv.contact?.phoneNumber || '';

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`p-3 cursor-pointer transition-colors relative ${
                    isSelected
                      ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600'
                      : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-semibold text-xs text-slate-900 truncate">
                      {contactName}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(conv.lastMessageAt || conv.updatedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono mb-1 truncate">{phone}</div>

                  <p className="text-xs text-slate-600 line-clamp-1 mb-2">
                    {conv.subject || 'WhatsApp Support Thread'}
                  </p>

                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                          conv.status === 'OPEN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : conv.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : conv.status === 'RESOLVED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {conv.status}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          conv.priority === 'URGENT'
                            ? 'bg-red-100 text-red-700'
                            : conv.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {conv.priority}
                      </span>
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CENTER PANEL: Message Stream & Action Bar */}
      {/* ========================================================================= */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden border-r border-slate-200">
          {/* Header Bar */}
          <div className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                {activeConversation.contact?.name.slice(0, 2).toUpperCase() || 'CU'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {activeConversation.contact?.name}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {activeConversation.contact?.phoneNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    WhatsApp 24h Window Active
                  </span>
                  <span>·</span>
                  <span>Ticket #{activeConversation.id.slice(-6)}</span>
                </div>
              </div>
            </div>

            {/* Conversation Actions */}
            <div className="flex items-center gap-2">
              {/* Assign Agent (Admin or Agent) */}
              {currentUser.role === 'ADMIN' && (
                <div className="flex items-center gap-1">
                  <label className="text-xs text-slate-500 hidden sm:inline">Assignee:</label>
                  <select
                    value={activeConversation.assignedAgentId || ''}
                    onChange={(e) => handleAssignAgent(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status selector */}
              <div className="flex items-center gap-1">
                <select
                  value={activeConversation.status}
                  onChange={(e) => handleStatusChange(e.target.value as ConversationStatus)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                >
                  <option value="OPEN">Open</option>
                  <option value="PENDING">Pending</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              {/* Fast Simulate Reply Button */}
              <button
                onClick={handleSimulateCustomerReply}
                disabled={isSimulatingReply}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                title="Simulate Inbound Customer Reply via Webhook"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden md:inline">
                  {isSimulatingReply ? 'Simulating...' : 'Simulate Customer Reply'}
                </span>
              </button>
            </div>
          </div>

          {/* Messages & Notes Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/70">
            {unifiedStream.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <MessageSquare className="w-8 h-8 mb-2 text-slate-300" />
                <span>No messages recorded in this conversation yet.</span>
              </div>
            ) : (
              unifiedStream.map((item) => {
                if (item.streamType === 'NOTE') {
                  const note = item as InternalNote;
                  return (
                    <div
                      key={note.id}
                      className="mx-auto max-w-xl bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] text-amber-800 font-semibold mb-1">
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          Internal Team Note — Visible only to staff
                        </span>
                        <span className="text-[10px] text-amber-700">
                          {new Date(note.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-amber-900">{note.content}</p>
                      <div className="text-[10px] text-amber-700 mt-1">
                        Author: {note.user?.name || 'Agent'}
                      </div>
                    </div>
                  );
                }

                const msg = item as Message;
                const isInbound = msg.direction === 'INBOUND';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-[70%] rounded-2xl p-3.5 shadow-xs ${
                        isInbound
                          ? 'bg-white text-slate-900 rounded-tl-xs border border-slate-200'
                          : 'bg-emerald-600 text-white rounded-tr-xs'
                      }`}
                    >
                      {/* Sender label */}
                      <div className="text-[10px] opacity-75 mb-1 font-medium flex items-center justify-between gap-3">
                        <span>{isInbound ? activeConversation.contact?.name : 'Support Agent'}</span>
                        {msg.type === 'TEMPLATE' && (
                          <span className="bg-emerald-700/60 text-emerald-100 px-1.5 py-0.2 rounded text-[9px] font-mono uppercase">
                            Template
                          </span>
                        )}
                      </div>

                      <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.body}</p>

                      {/* Footer: timestamp + delivery status */}
                      <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] opacity-75">
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {/* Status receipts for outbound WhatsApp messages */}
                        {!isInbound && (
                          <span title={`WhatsApp Status: ${msg.status}`}>
                            {msg.status === 'READ' && (
                              <CheckCheck className="w-3.5 h-3.5 text-cyan-200" />
                            )}
                            {msg.status === 'DELIVERED' && (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-100" />
                            )}
                            {msg.status === 'SENT' && (
                              <Check className="w-3.5 h-3.5 text-emerald-200" />
                            )}
                            {msg.status === 'FAILED' && (
                              <AlertCircle className="w-3.5 h-3.5 text-red-200" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata tag */}
                    <div className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">
                      wamid: {msg.whatsappMessageId ? `${msg.whatsappMessageId.slice(0, 16)}...` : msg.id.slice(-8)}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Template Picker Modal/Popover */}
          {showTemplatePicker && (
            <div className="p-3 bg-white border-t border-slate-200 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Select Approved Meta WhatsApp Template
                </span>
                <button
                  onClick={() => setShowTemplatePicker(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() =>
                    handleSendTemplate(
                      'sample_shipping_confirmation',
                      'Your order #WH-8891 has been dispatched. Track at https://enterprise.io/track'
                    )
                  }
                  className="p-2.5 text-left border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 text-xs transition-colors"
                >
                  <div className="font-semibold text-slate-900">Shipping Confirmation</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Order dispatched with tracking link.
                  </div>
                </button>
                <button
                  onClick={() =>
                    handleSendTemplate(
                      'appointment_reminder_v1',
                      'Reminder: Your consultation is scheduled for tomorrow at 2:00 PM EST.'
                    )
                  }
                  className="p-2.5 text-left border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 text-xs transition-colors"
                >
                  <div className="font-semibold text-slate-900">Appointment Reminder</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Consultation reminder with date/time.
                  </div>
                </button>
                <button
                  onClick={() =>
                    handleSendTemplate(
                      'support_ticket_resolved',
                      'Your support ticket has been resolved by our team. Please rate our service.'
                    )
                  }
                  className="p-2.5 text-left border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 text-xs transition-colors"
                >
                  <div className="font-semibold text-slate-900">Ticket Resolved</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Resolution confirmation and feedback.
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Reply Bar */}
          <div className="bg-white border-t border-slate-200 p-3 space-y-2">
            {/* Mode Switcher & Quick Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setMessageMode('WHATSAPP')}
                  className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                    messageMode === 'WHATSAPP'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Message</span>
                </button>
                <button
                  onClick={() => setMessageMode('NOTE')}
                  className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                    messageMode === 'NOTE'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Internal Note</span>
                </button>
              </div>

              {messageMode === 'WHATSAPP' && (
                <button
                  onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                  className="text-xs font-semibold px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Use WhatsApp Template</span>
                </button>
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  messageMode === 'WHATSAPP'
                    ? 'Type WhatsApp reply to customer (Enter to send)...'
                    : 'Type internal team note (Enter to save)...'
                }
                rows={2}
                className={`flex-1 p-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 resize-none ${
                  messageMode === 'WHATSAPP'
                    ? 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'
                    : 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-200'
                }`}
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className={`px-4 py-3 rounded-xl font-semibold text-xs text-white flex items-center gap-1.5 transition-all shrink-0 ${
                  messageMode === 'WHATSAPP'
                    ? 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50'
                    : 'bg-amber-500 hover:bg-amber-600 disabled:opacity-50'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'Sending...' : 'Send'}</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
          <MessageSquare className="w-10 h-10 mb-2 text-slate-300" />
          <span>Select a conversation from the left to view customer thread</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RIGHT PANEL: Customer CRM Dossier */}
      {/* ========================================================================= */}
      {activeConversation && activeConversation.contact && (
        <div className="w-72 md:w-80 bg-white border-l border-slate-200 overflow-y-auto hidden lg:flex flex-col shrink-0 p-4 space-y-5">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Customer Dossier
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base">
                {activeConversation.contact.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {activeConversation.contact.name}
                </div>
                <div className="text-xs text-slate-500">
                  {activeConversation.contact.company || 'Private Client'}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-mono text-slate-900 select-all">
                {activeConversation.contact.phoneNumber}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{activeConversation.contact.email || 'No email on file'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{activeConversation.contact.company || 'Individual'}</span>
            </div>
          </div>

          {/* Tags Manager */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Customer Tags
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(activeConversation.contact.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1 mt-1">
              <input
                type="text"
                placeholder="Add tag..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={handleAddTag}
                className="p-1 text-xs bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CRM Account Notes */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              CRM Account Notes
            </span>
            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed whitespace-pre-wrap">
              {activeConversation.contact.notes || 'No CRM notes recorded for this customer yet.'}
            </div>
          </div>

          {/* Ticket Metadata */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <span className="font-bold text-slate-700">Ticket Telemetry</span>
            <div className="bg-slate-50 rounded-lg p-2.5 space-y-1.5 text-[11px] text-slate-600 font-mono">
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{new Date(activeConversation.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Event:</span>
                <span>{new Date(activeConversation.lastMessageAt || activeConversation.updatedAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Messages:</span>
                <span>{messages.length} total</span>
              </div>
              <div className="flex justify-between">
                <span>Channel:</span>
                <span className="text-emerald-700 font-semibold">WhatsApp Cloud API</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
