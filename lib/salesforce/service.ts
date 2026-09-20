import { sfClient } from './client';
import { dbStore } from '../db/store';
import {
  SalesforceContactRecord,
  SalesforceLeadRecord,
  SalesforceTaskRecord,
  SalesforceCaseRecord,
  SyncResult,
} from './types';
import { Contact, Message, Conversation } from '../db/types';

export class SalesforceSyncService {
  /**
   * Helper: Normalize phone numbers for duplicate detection (e.g. +1 (555) 019-2831 -> 15550192831)
   */
  public static normalizePhone(phone?: string | null): string {
    if (!phone) return '';
    return phone.replace(/[^\d]/g, '');
  }

  /**
   * Inbound Sync: Salesforce Contacts -> Local CRM Contacts
   */
  public static async syncContactsInbound(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsProcessed = 0;
    let recordsSynced = 0;
    let recordsFailed = 0;

    try {
      const soql =
        'SELECT Id, FirstName, LastName, Name, Email, Phone, MobilePhone, Department, Title, Description, Account.Name, LastModifiedDate FROM Contact ORDER BY LastModifiedDate DESC LIMIT 100';
      const result = await sfClient.query<SalesforceContactRecord>(soql);
      const sfContacts = result.records || [];
      recordsProcessed = sfContacts.length;

      const mappings = await dbStore.getFieldMappings('Contact');
      const activeMappings = mappings.filter((m) => m.isActive);

      for (const sfContact of sfContacts) {
        try {
          const sfPhone = sfContact.Phone || sfContact.MobilePhone || '';
          const sfEmail = sfContact.Email || '';
          const sfName = sfContact.Name || `${sfContact.FirstName || ''} ${sfContact.LastName}`.trim();
          const sfCompany = sfContact.Account?.Name || sfContact.Department || '';
          const sfNotes = sfContact.Description || '';

          // Duplicate detection & matching
          const matchResult = await dbStore.findMatchingContact({
            salesforceId: sfContact.Id,
            phoneNumber: sfPhone,
            email: sfEmail,
            name: sfName,
            company: sfCompany,
          });

          if (matchResult) {
            // Update existing contact
            const existing = matchResult.contact;
            const updates: Partial<Contact> = {
              salesforceId: sfContact.Id,
              salesforceType: 'Contact',
              salesforceSyncAt: new Date().toISOString(),
            };

            // Apply field mappings (SF -> Local)
            if (!existing.email && sfEmail) updates.email = sfEmail;
            if (!existing.company && sfCompany) updates.company = sfCompany;
            if (existing.name.startsWith('WhatsApp User') && sfName) updates.name = sfName;
            if (sfNotes && !existing.notes) updates.notes = sfNotes;

            // Merge tags
            if (!existing.tags.includes('Salesforce-Contact')) {
              updates.tags = [...existing.tags, 'Salesforce-Contact'];
            }

            await dbStore.updateContact(existing.id, updates);
            recordsSynced++;
          } else if (sfPhone || sfEmail) {
            // Create new CRM contact from Salesforce
            const phoneToUse = sfPhone || `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
            await dbStore.createContact({
              name: sfName || 'Salesforce Contact',
              phoneNumber: phoneToUse,
              email: sfEmail || null,
              company: sfCompany || null,
              notes: sfNotes || null,
              tags: ['Salesforce-Contact', 'Synced-From-SF'],
              salesforceId: sfContact.Id,
              salesforceType: 'Contact',
              salesforceSyncAt: new Date().toISOString(),
            });
            recordsSynced++;
          }
        } catch (err: unknown) {
          recordsFailed++;
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Error syncing Contact ${sfContact.Id}: ${msg}`);
        }
      }

      const durationMs = Date.now() - startTime;
      const status = recordsFailed === 0 ? 'SUCCESS' : recordsSynced > 0 ? 'PARTIAL' : 'FAILED';

      await dbStore.createSalesforceSyncLog({
        direction: 'INBOUND',
        entityType: 'CONTACT',
        status,
        recordsProcessed,
        recordsSynced,
        recordsFailed,
        durationMs,
        error: errors.length > 0 ? errors.join('; ') : null,
      });

      return {
        success: recordsFailed === 0,
        direction: 'INBOUND',
        entityType: 'CONTACT',
        recordsProcessed,
        recordsSynced,
        recordsFailed,
        durationMs,
        errors,
      };
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);

      await dbStore.createSalesforceSyncLog({
        direction: 'INBOUND',
        entityType: 'CONTACT',
        status: 'FAILED',
        recordsProcessed,
        recordsSynced,
        recordsFailed: recordsProcessed || 1,
        durationMs,
        error: msg,
      });

      return {
        success: false,
        direction: 'INBOUND',
        entityType: 'CONTACT',
        recordsProcessed,
        recordsSynced,
        recordsFailed: recordsProcessed || 1,
        durationMs,
        errors,
      };
    }
  }

  /**
   * Inbound Sync: Salesforce Leads -> Local CRM Contacts
   */
  public static async syncLeadsInbound(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsProcessed = 0;
    let recordsSynced = 0;
    let recordsFailed = 0;

    try {
      const soql =
        'SELECT Id, FirstName, LastName, Name, Email, Phone, MobilePhone, Company, Status, Title, Description, LastModifiedDate FROM Lead WHERE IsConverted = false ORDER BY LastModifiedDate DESC LIMIT 100';
      const result = await sfClient.query<SalesforceLeadRecord>(soql);
      const sfLeads = result.records || [];
      recordsProcessed = sfLeads.length;

      for (const sfLead of sfLeads) {
        try {
          const sfPhone = sfLead.Phone || sfLead.MobilePhone || '';
          const sfEmail = sfLead.Email || '';
          const sfName = sfLead.Name || `${sfLead.FirstName || ''} ${sfLead.LastName}`.trim();
          const sfCompany = sfLead.Company || '';
          const sfNotes = sfLead.Description || (sfLead.Status ? `Lead Status: ${sfLead.Status}` : '');

          const matchResult = await dbStore.findMatchingContact({
            salesforceId: sfLead.Id,
            phoneNumber: sfPhone,
            email: sfEmail,
            name: sfName,
            company: sfCompany,
          });

          if (matchResult) {
            const existing = matchResult.contact;
            const updates: Partial<Contact> = {
              salesforceId: sfLead.Id,
              salesforceType: 'Lead',
              salesforceSyncAt: new Date().toISOString(),
            };

            if (!existing.email && sfEmail) updates.email = sfEmail;
            if (!existing.company && sfCompany) updates.company = sfCompany;
            if (existing.name.startsWith('WhatsApp User') && sfName) updates.name = sfName;

            const tags = new Set(existing.tags);
            tags.add('Salesforce-Lead');
            if (sfLead.Status) tags.add(`Lead:${sfLead.Status}`);
            updates.tags = Array.from(tags);

            await dbStore.updateContact(existing.id, updates);
            recordsSynced++;
          } else if (sfPhone || sfEmail) {
            const phoneToUse = sfPhone || `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
            await dbStore.createContact({
              name: sfName || 'Salesforce Lead',
              phoneNumber: phoneToUse,
              email: sfEmail || null,
              company: sfCompany || 'Prospective Lead',
              notes: sfNotes || null,
              tags: ['Salesforce-Lead', sfLead.Status ? `Lead:${sfLead.Status}` : 'Open-Lead'],
              salesforceId: sfLead.Id,
              salesforceType: 'Lead',
              salesforceSyncAt: new Date().toISOString(),
            });
            recordsSynced++;
          }
        } catch (err: unknown) {
          recordsFailed++;
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Error syncing Lead ${sfLead.Id}: ${msg}`);
        }
      }

      const durationMs = Date.now() - startTime;
      const status = recordsFailed === 0 ? 'SUCCESS' : recordsSynced > 0 ? 'PARTIAL' : 'FAILED';

      await dbStore.createSalesforceSyncLog({
        direction: 'INBOUND',
        entityType: 'LEAD',
        status,
        recordsProcessed,
        recordsSynced,
        recordsFailed,
        durationMs,
        error: errors.length > 0 ? errors.join('; ') : null,
      });

      return {
        success: recordsFailed === 0,
        direction: 'INBOUND',
        entityType: 'LEAD',
        recordsProcessed,
        recordsSynced,
        recordsFailed,
        durationMs,
        errors,
      };
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);

      await dbStore.createSalesforceSyncLog({
        direction: 'INBOUND',
        entityType: 'LEAD',
        status: 'FAILED',
        recordsProcessed,
        recordsSynced,
        recordsFailed: recordsProcessed || 1,
        durationMs,
        error: msg,
      });

      return {
        success: false,
        direction: 'INBOUND',
        entityType: 'LEAD',
        recordsProcessed,
        recordsSynced,
        recordsFailed: recordsProcessed || 1,
        durationMs,
        errors,
      };
    }
  }

  /**
   * Outbound Sync: Push a local CRM Contact to Salesforce (as Contact or Lead)
   */
  public static async syncContactOutbound(contactId: string): Promise<{
    success: boolean;
    salesforceId?: string;
    salesforceType?: 'Contact' | 'Lead';
    error?: string;
  }> {
    try {
      const contact = await dbStore.findContactById(contactId);
      if (!contact) {
        return { success: false, error: 'Contact not found' };
      }

      const integ = await dbStore.getSalesforceIntegration();
      const targetObj = contact.salesforceType || integ?.targetObject || 'Contact';
      const isLead = targetObj === 'Lead';

      const names = contact.name.trim().split(' ');
      const lastName = names.length > 1 ? names.slice(1).join(' ') : names[0] || 'Unknown';
      const firstName = names.length > 1 ? names[0] : '';

      if (contact.salesforceId) {
        // Update existing record in Salesforce
        const sObject = isLead ? 'Lead' : 'Contact';
        const payload: Record<string, unknown> = {
          LastName: lastName,
          FirstName: firstName,
          Phone: contact.phoneNumber,
        };
        if (contact.email) payload.Email = contact.email;
        if (isLead && contact.company) payload.Company = contact.company;
        if (contact.notes) payload.Description = contact.notes;

        await sfClient.updateSObject(sObject, contact.salesforceId, payload);
        await dbStore.updateContact(contact.id, {
          salesforceSyncAt: new Date().toISOString(),
        });

        return { success: true, salesforceId: contact.salesforceId, salesforceType: isLead ? 'Lead' : 'Contact' };
      } else {
        // Create new record in Salesforce
        const sObject = isLead ? 'Lead' : 'Contact';
        const payload: Record<string, unknown> = {
          LastName: lastName,
          FirstName: firstName,
          Phone: contact.phoneNumber,
        };
        if (contact.email) payload.Email = contact.email;
        if (isLead) {
          payload.Company = contact.company || 'WhatsApp Contact';
        }
        if (contact.notes) payload.Description = contact.notes;

        const result = await sfClient.createSObject(sObject, payload);
        if (result.id) {
          await dbStore.updateContact(contact.id, {
            salesforceId: result.id,
            salesforceType: isLead ? 'Lead' : 'Contact',
            salesforceSyncAt: new Date().toISOString(),
          });
          return { success: true, salesforceId: result.id, salesforceType: isLead ? 'Lead' : 'Contact' };
        } else {
          return { success: false, error: 'Failed to create Salesforce SObject' };
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  /**
   * Sync WhatsApp Message -> Salesforce Activity Task
   */
  public static async syncMessageToSalesforce(messageId: string): Promise<{
    success: boolean;
    taskId?: string;
    error?: string;
  }> {
    try {
      const message = await dbStore.findMessageById(messageId);
      if (!message) return { success: false, error: 'Message not found' };

      const conversation = await dbStore.findConversationById(message.conversationId);
      if (!conversation || !conversation.contact) {
        return { success: false, error: 'Conversation or Contact not found' };
      }

      let sfId = conversation.contact.salesforceId;

      // If contact is not yet linked to Salesforce, push or match contact first
      if (!sfId) {
        const syncContactRes = await this.syncContactOutbound(conversation.contact.id);
        if (syncContactRes.success && syncContactRes.salesforceId) {
          sfId = syncContactRes.salesforceId;
        }
      }

      const isInbound = message.direction === 'INBOUND';
      const subject = `WhatsApp ${isInbound ? 'Inbound' : 'Outbound'}: ${
        message.body ? message.body.slice(0, 40) : message.type
      }`;

      const taskData: SalesforceTaskRecord = {
        WhoId: sfId || null,
        Subject: subject,
        Description: `WhatsApp Message Details:\n- Direction: ${message.direction}\n- Type: ${message.type}\n- Status: ${message.status}\n- Timestamp: ${message.timestamp}\n- WhatsApp Message ID: ${message.whatsappMessageId || 'N/A'}\n\nContent:\n${message.body || '[Media/Template]'}`,
        Status: 'Completed',
        Priority: 'Normal',
        ActivityDate: new Date(message.timestamp).toISOString().split('T')[0],
        TaskSubtype: 'Task',
      };

      const result = await sfClient.createSObject('Task', taskData as unknown as Record<string, unknown>);
      if (result.id) {
        await dbStore.updateMessage(message.id, {
          salesforceTaskId: result.id,
          salesforceSyncAt: new Date().toISOString(),
        });
        return { success: true, taskId: result.id };
      }
      return { success: false, error: 'Task creation returned no ID' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  /**
   * Sync WhatsApp Conversation -> Salesforce Case
   */
  public static async syncConversationToSalesforce(conversationId: string): Promise<{
    success: boolean;
    caseId?: string;
    error?: string;
  }> {
    try {
      const conversation = await dbStore.findConversationById(conversationId);
      if (!conversation || !conversation.contact) {
        return { success: false, error: 'Conversation not found' };
      }

      const sfContactId = conversation.contact.salesforceId;
      const casePriority =
        conversation.priority === 'URGENT' || conversation.priority === 'HIGH'
          ? 'High'
          : conversation.priority === 'LOW'
          ? 'Low'
          : 'Medium';

      const caseStatus =
        conversation.status === 'RESOLVED' || conversation.status === 'CLOSED'
          ? 'Closed'
          : 'Working';

      const caseData: SalesforceCaseRecord = {
        ContactId: sfContactId || null,
        Subject: conversation.subject || `WhatsApp Support Thread: ${conversation.contact.name}`,
        Description: `WhatsApp Support Conversation\nCustomer: ${conversation.contact.name} (${conversation.contact.phoneNumber})\nStatus: ${conversation.status}\nPriority: ${conversation.priority}`,
        Status: caseStatus,
        Priority: casePriority,
        Origin: 'WhatsApp',
      };

      if (conversation.salesforceCaseId) {
        await sfClient.updateSObject('Case', conversation.salesforceCaseId, caseData as unknown as Record<string, unknown>);
        await dbStore.updateConversation(conversation.id, {
          salesforceSyncAt: new Date().toISOString(),
        });
        return { success: true, caseId: conversation.salesforceCaseId };
      } else {
        const result = await sfClient.createSObject('Case', caseData as unknown as Record<string, unknown>);
        if (result.id) {
          await dbStore.updateConversation(conversation.id, {
            salesforceCaseId: result.id,
            salesforceSyncAt: new Date().toISOString(),
          });
          return { success: true, caseId: result.id };
        }
        return { success: false, error: 'Case creation returned no ID' };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  /**
   * Full Bidirectional Sync
   */
  public static async syncAll(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let totalProcessed = 0;
    let totalSynced = 0;
    let totalFailed = 0;

    const integ = await dbStore.getSalesforceIntegration();
    const targetObj = integ?.targetObject || 'Both';

    // 1. Inbound Contacts Sync
    if (targetObj === 'Contact' || targetObj === 'Both') {
      const contactRes = await this.syncContactsInbound();
      totalProcessed += contactRes.recordsProcessed;
      totalSynced += contactRes.recordsSynced;
      totalFailed += contactRes.recordsFailed;
      errors.push(...contactRes.errors);
    }

    // 2. Inbound Leads Sync
    if (targetObj === 'Lead' || targetObj === 'Both') {
      const leadRes = await this.syncLeadsInbound();
      totalProcessed += leadRes.recordsProcessed;
      totalSynced += leadRes.recordsSynced;
      totalFailed += leadRes.recordsFailed;
      errors.push(...leadRes.errors);
    }

    // 3. Outbound Unsynced Contacts
    const localContacts = await dbStore.getAllContacts();
    for (const contact of localContacts) {
      if (!contact.salesforceId) {
        totalProcessed++;
        const outRes = await this.syncContactOutbound(contact.id);
        if (outRes.success) {
          totalSynced++;
        } else {
          totalFailed++;
          if (outRes.error) errors.push(outRes.error);
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const status = totalFailed === 0 ? 'SUCCESS' : totalSynced > 0 ? 'PARTIAL' : 'FAILED';

    if (integ) {
      await dbStore.saveSalesforceIntegration({
        ...integ,
        lastSyncAt: new Date().toISOString(),
        lastError: errors.length > 0 ? errors[0] : null,
      });
    }

    await dbStore.createSalesforceSyncLog({
      direction: 'BIDIRECTIONAL',
      entityType: 'ALL',
      status,
      recordsProcessed: totalProcessed,
      recordsSynced: totalSynced,
      recordsFailed: totalFailed,
      durationMs,
      error: errors.length > 0 ? errors.join('; ') : null,
      details: { targetObject: targetObj },
    });

    return {
      success: totalFailed === 0,
      direction: 'BIDIRECTIONAL',
      entityType: 'ALL',
      recordsProcessed: totalProcessed,
      recordsSynced: totalSynced,
      recordsFailed: totalFailed,
      durationMs,
      errors,
    };
  }

  /**
   * Handle Salesforce Webhooks / Change Data Capture / Outbound Message events
   */
  public static async handleWebhookEvent(payload: Record<string, unknown>): Promise<{
    success: boolean;
    action: string;
    details?: Record<string, unknown>;
  }> {
    const eventType = (payload.event_type || payload.type || payload.sobject || 'SalesforceEvent') as string;
    const rawData = payload.data as Record<string, unknown> | undefined;
    const schemaStr = typeof rawData?.schema === 'string' ? rawData.schema : undefined;
    const sObject = (payload.sobject || payload.object_type || (schemaStr ? schemaStr.split('/').pop() : undefined)) as string | undefined;
    const recordData = (payload.record || payload.data || payload) as Record<string, unknown>;

    // Log the webhook in WebhookEvents
    await dbStore.recordWebhookEvent({
      eventId: `sf-evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      eventType: `salesforce.${eventType}`,
      payload,
    });

    if (sObject === 'Contact' || eventType.includes('Contact')) {
      await this.syncContactsInbound();
      return { success: true, action: 'SYNCED_CONTACTS', details: { sObject: 'Contact' } };
    } else if (sObject === 'Lead' || eventType.includes('Lead')) {
      await this.syncLeadsInbound();
      return { success: true, action: 'SYNCED_LEADS', details: { sObject: 'Lead' } };
    }

    return { success: true, action: 'EVENT_ACKNOWLEDGED', details: { eventType } };
  }
}
