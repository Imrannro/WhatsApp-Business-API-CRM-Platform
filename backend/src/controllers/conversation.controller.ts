import { Response } from 'express';
import { dbStore } from '../../../lib/db/store';
import { getWhatsAppProvider } from '../../../lib/whatsapp';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ConversationStatus } from '../../../lib/db/types';

export class ConversationController {
  public static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const status = req.query.status as ConversationStatus | undefined;
    const assignedAgentId = req.query.assignedAgentId as string | undefined;
    const unreadOnly = req.query.unreadOnly === 'true';
    const search = req.query.search as string | undefined;

    // If agent role and not admin, default or filter to assigned conversations if requested
    let filterAgentId = assignedAgentId;
    if (req.user?.role === 'AGENT' && req.query.all !== 'true') {
      filterAgentId = req.user.id;
    }

    const conversations = await dbStore.getAllConversations({
      status,
      assignedAgentId: filterAgentId,
      unreadOnly,
      search,
    });

    res.status(200).json({ success: true, count: conversations.length, data: conversations });
  }

  public static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const conversationId = String(req.params.id);
    const conversation = await dbStore.findConversationById(conversationId);
    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found' });
      return;
    }

    // Agent permission check: agents can view assigned conversations or unassigned conversations
    if (
      req.user?.role === 'AGENT' &&
      conversation.assignedAgentId &&
      conversation.assignedAgentId !== req.user.id
    ) {
      // Permission policy: admin can see all; agent can see assigned or unassigned
      res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to access this assigned conversation',
      });
      return;
    }

    const messages = await dbStore.getMessagesByConversationId(conversation.id);
    const internalNotes = await dbStore.getInternalNotesByConversationId(conversation.id);

    // Reset unread count when opened by agent
    if (conversation.unreadCount > 0) {
      await dbStore.updateConversation(conversation.id, { unreadCount: 0 });
      conversation.unreadCount = 0;
    }

    res.status(200).json({
      success: true,
      data: {
        conversation,
        messages,
        internalNotes,
      },
    });
  }

  public static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { contactId, assignedAgentId, subject, priority } = req.body;

    const contact = await dbStore.findContactById(contactId);
    if (!contact) {
      res.status(404).json({ success: false, error: 'Contact not found' });
      return;
    }

    const conversation = await dbStore.createConversation({
      contactId,
      assignedAgentId: assignedAgentId || (req.user?.role === 'AGENT' ? req.user.id : null),
      subject,
      priority,
    });

    await dbStore.createAuditLog({
      userId: req.user?.id,
      action: 'CONVERSATION_CREATE',
      resource: 'Conversation',
      resourceId: conversation.id,
      details: { contactId, subject },
    });

    res.status(201).json({ success: true, data: conversation });
  }

  public static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const conversationId = String(req.params.id);
    const { status, priority, subject } = req.body;
    const conversation = await dbStore.updateConversation(conversationId, {
      status,
      priority,
      subject,
    });

    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found' });
      return;
    }

    await dbStore.createAuditLog({
      userId: req.user?.id,
      action: 'CONVERSATION_UPDATE',
      resource: 'Conversation',
      resourceId: conversation.id,
      details: req.body,
    });

    res.status(200).json({ success: true, data: conversation });
  }

  public static async assign(req: AuthenticatedRequest, res: Response): Promise<void> {
    const conversationId = String(req.params.id);
    const { agentId } = req.body;
    let agentName = 'Unassigned';

    if (agentId) {
      const agent = await dbStore.findUserById(agentId);
      if (!agent) {
        res.status(404).json({ success: false, error: 'Agent not found' });
        return;
      }
      agentName = agent.name;
    }

    const conversation = await dbStore.updateConversation(conversationId, {
      assignedAgentId: agentId || null,
    });

    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found' });
      return;
    }

    await dbStore.createAuditLog({
      userId: req.user?.id,
      action: 'CONVERSATION_ASSIGN',
      resource: 'Conversation',
      resourceId: conversation.id,
      details: { assignedAgentId: agentId, assignedAgentName: agentName },
    });

    res.status(200).json({
      success: true,
      message: `Conversation successfully assigned to ${agentName}`,
      data: conversation,
    });
  }

  public static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const conversationId = String(req.params.id);
    const conversation = await dbStore.findConversationById(conversationId);
    if (!conversation || !conversation.contact) {
      res.status(404).json({ success: false, error: 'Conversation or Contact not found' });
      return;
    }

    const { body, type, templateName } = req.body;
    const provider = getWhatsAppProvider();

    let sendResult;
    if (type === 'TEMPLATE' && templateName) {
      sendResult = await provider.sendTemplateMessage({
        to: conversation.contact.phoneNumber,
        templateName,
      });
    } else {
      sendResult = await provider.sendTextMessage({
        to: conversation.contact.phoneNumber,
        text: body,
      });
    }

    const message = await dbStore.createMessage({
      conversationId: conversation.id,
      whatsappMessageId: sendResult.whatsappMessageId,
      direction: 'OUTBOUND',
      type: type || 'TEXT',
      body,
      status: sendResult.status,
      senderPhone: 'Business Support',
      recipientPhone: conversation.contact.phoneNumber,
      errorMessage: sendResult.error,
      metadata: {
        provider: provider.name,
        isMock: provider.isMock,
        sentByUserId: req.user?.id,
        sentByUserName: req.user?.name,
      },
    });

    await dbStore.createAuditLog({
      userId: req.user?.id,
      action: 'MESSAGE_SEND',
      resource: 'Message',
      resourceId: message.id,
      details: {
        recipient: conversation.contact.phoneNumber,
        provider: provider.name,
        status: sendResult.status,
        whatsappMessageId: sendResult.whatsappMessageId,
      },
    });

    res.status(201).json({
      success: sendResult.success,
      data: message,
      provider: {
        name: provider.name,
        isMock: provider.isMock,
      },
      error: sendResult.error,
    });
  }

  public static async addNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const conversationId = String(req.params.id);
    const conversation = await dbStore.findConversationById(conversationId);
    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found' });
      return;
    }

    const note = await dbStore.createInternalNote({
      conversationId: conversation.id,
      userId: req.user.id,
      content: req.body.content,
    });

    await dbStore.createAuditLog({
      userId: req.user.id,
      action: 'INTERNAL_NOTE_ADD',
      resource: 'InternalNote',
      resourceId: note.id,
      details: { conversationId: conversation.id },
    });

    res.status(201).json({ success: true, data: note });
  }

  public static async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    const conversationId = String(req.params.id);
    const messages = await dbStore.getMessagesByConversationId(conversationId);
    res.status(200).json({ success: true, count: messages.length, data: messages });
  }
}
