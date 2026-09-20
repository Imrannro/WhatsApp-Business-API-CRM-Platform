import { dbStore } from '../db/store';
import { MetaWebhookPayload } from '../whatsapp/types';
import { MessageStatus } from '../db/types';

export interface WebhookProcessingResult {
  processed: boolean;
  messagesHandled: number;
  statusesHandled: number;
  duplicateIgnored: number;
  errors: string[];
}

export async function processWhatsAppWebhook(
  payload: MetaWebhookPayload
): Promise<WebhookProcessingResult> {
  const result: WebhookProcessingResult = {
    processed: true,
    messagesHandled: 0,
    statusesHandled: 0,
    duplicateIgnored: 0,
    errors: [],
  };

  if (payload.object !== 'whatsapp_business_account') {
    // If not a WhatsApp Business Account payload, ignore safely
    return result;
  }

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const val = change.value;
      if (!val || val.messaging_product !== 'whatsapp') continue;

      // 1. Process Status Updates (sent, delivered, read, failed)
      if (val.statuses && Array.isArray(val.statuses)) {
        for (const st of val.statuses) {
          const wamid = st.id;
          const statusMap: Record<string, MessageStatus> = {
            sent: 'SENT',
            delivered: 'DELIVERED',
            read: 'READ',
            failed: 'FAILED',
          };
          const mappedStatus = statusMap[st.status] || 'PENDING';
          const errorDetail =
            st.errors && st.errors.length > 0
              ? `${st.errors[0].code}: ${st.errors[0].title} - ${st.errors[0].message}`
              : undefined;

          const updated = await dbStore.updateMessageStatus(wamid, mappedStatus, errorDetail);
          if (updated) {
            result.statusesHandled++;
            await dbStore.createAuditLog({
              action: 'STATUS_UPDATE',
              resource: 'Message',
              resourceId: updated.id,
              details: {
                whatsappMessageId: wamid,
                newStatus: mappedStatus,
                recipientId: st.recipient_id,
              },
            });
          }
        }
      }

      // 2. Process Inbound Messages
      if (val.messages && Array.isArray(val.messages)) {
        for (const msg of val.messages) {
          const wamid = msg.id;

          // Idempotency: check if message ID already processed
          const existing = await dbStore.findMessageByWhatsappId(wamid);
          if (existing) {
            result.duplicateIgnored++;
            continue;
          }

          // Idempotency event check
          const eventRecord = await dbStore.findWebhookEvent(wamid);
          if (eventRecord && eventRecord.processed) {
            result.duplicateIgnored++;
            continue;
          }

          await dbStore.recordWebhookEvent({
            eventId: wamid,
            eventType: `message.${msg.type}`,
            payload: msg as unknown as Record<string, unknown>,
          });

          try {
            const rawSenderPhone = msg.from;
            const senderPhone = rawSenderPhone.startsWith('+')
              ? rawSenderPhone
              : `+${rawSenderPhone}`;

            // Resolve or Auto-create Contact
            let contact = await dbStore.findContactByPhone(senderPhone);
            if (!contact) {
              // Extract profile name from webhook metadata if available
              const profileName =
                val.contacts?.find((c) => c.wa_id === rawSenderPhone)?.profile?.name ||
                `WhatsApp User (${senderPhone.slice(-4)})`;

              contact = await dbStore.createContact({
                phoneNumber: senderPhone,
                name: profileName,
                notes: 'Contact automatically provisioned via inbound WhatsApp message.',
                tags: ['WhatsApp Inbound', 'New Lead'],
              });

              await dbStore.createAuditLog({
                action: 'CONTACT_AUTO_CREATED',
                resource: 'Contact',
                resourceId: contact.id,
                details: { phoneNumber: senderPhone, name: profileName },
              });
            } else {
              // Update last interaction
              await dbStore.updateContact(contact.id, {
                lastInteraction: new Date().toISOString(),
              });
            }

            // Resolve or Create Conversation
            let conversation = await dbStore.findConversationByContactId(contact.id);
            if (!conversation || conversation.status === 'CLOSED') {
              conversation = await dbStore.createConversation({
                contactId: contact.id,
                subject: `Conversation with ${contact.name}`,
                priority: 'MEDIUM',
              });
            } else if (conversation.status === 'RESOLVED') {
              // Re-open if new inbound message arrives
              conversation = await dbStore.updateConversation(conversation.id, {
                status: 'OPEN',
              });
            }

            // Extract message body based on message type
            let body = '';
            const msgType = (msg.type?.toUpperCase() as any) || 'TEXT';
            if (msg.text?.body) {
              body = msg.text.body;
            } else if (msg.type === 'image') {
              body = msg.image?.caption || '[Image received]';
            } else if (msg.type === 'document') {
              body = `[Document: ${msg.document?.filename || 'Attachment'}]`;
            } else if (msg.type === 'interactive') {
              body = '[Interactive Response]';
            } else {
              body = `[${msg.type} message]`;
            }

            // Store message
            const createdMsg = await dbStore.createMessage({
              conversationId: conversation!.id,
              whatsappMessageId: wamid,
              direction: 'INBOUND',
              type: ['TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'TEMPLATE'].includes(msgType)
                ? msgType
                : 'TEXT',
              body,
              status: 'DELIVERED',
              senderPhone,
              recipientPhone: val.metadata?.display_phone_number || null,
              metadata: {
                metaTimestamp: msg.timestamp,
                metaType: msg.type,
                displayPhoneNumber: val.metadata?.display_phone_number,
              },
            });

            await dbStore.markWebhookProcessed(wamid);
            result.messagesHandled++;

            await dbStore.createAuditLog({
              action: 'INBOUND_MESSAGE_RECEIVED',
              resource: 'Message',
              resourceId: createdMsg.id,
              details: {
                conversationId: conversation!.id,
                sender: senderPhone,
                type: msg.type,
              },
            });
          } catch (err: unknown) {
            const errStr = err instanceof Error ? err.message : 'Unknown message processing error';
            result.errors.push(errStr);
            await dbStore.markWebhookProcessed(wamid, errStr);
          }
        }
      }
    }
  }

  return result;
}
