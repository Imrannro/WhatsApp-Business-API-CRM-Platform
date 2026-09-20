import { Response } from 'express';
import { dbStore } from '../../../lib/db/store';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class ContactController {
  public static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const search = req.query.search as string | undefined;
    const tag = req.query.tag as string | undefined;

    const contacts = await dbStore.getAllContacts({ search, tag });
    res.status(200).json({ success: true, count: contacts.length, data: contacts });
  }

  public static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const contactId = String(req.params.id);
    const contact = await dbStore.findContactById(contactId);
    if (!contact) {
      res.status(404).json({ success: false, error: 'Contact not found' });
      return;
    }

    const conversation = await dbStore.findConversationByContactId(contact.id);
    const messages = conversation
      ? await dbStore.getMessagesByConversationId(conversation.id)
      : [];

    res.status(200).json({
      success: true,
      data: {
        contact,
        conversation,
        messages,
      },
    });
  }

  public static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { phoneNumber, name, email, company, tags, notes } = req.body;

    const existing = await dbStore.findContactByPhone(phoneNumber);
    if (existing) {
      res.status(409).json({
        success: false,
        error: 'A contact with this phone number already exists',
        data: existing,
      });
      return;
    }

    const contact = await dbStore.createContact({
      phoneNumber,
      name,
      email,
      company,
      tags,
      notes,
    });

    await dbStore.createAuditLog({
      userId: req.user?.id,
      action: 'CONTACT_CREATE',
      resource: 'Contact',
      resourceId: contact.id,
      details: { name: contact.name, phoneNumber: contact.phoneNumber },
    });

    res.status(201).json({ success: true, data: contact });
  }

  public static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const contactId = String(req.params.id);
    const contact = await dbStore.updateContact(contactId, req.body);
    if (!contact) {
      res.status(404).json({ success: false, error: 'Contact not found' });
      return;
    }

    await dbStore.createAuditLog({
      userId: req.user?.id,
      action: 'CONTACT_UPDATE',
      resource: 'Contact',
      resourceId: contact.id,
      details: req.body,
    });

    res.status(200).json({ success: true, data: contact });
  }

  public static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const contactId = String(req.params.id);
    const success = await dbStore.deleteContact(contactId);
    if (!success) {
      res.status(404).json({ success: false, error: 'Contact not found' });
      return;
    }

    await dbStore.createAuditLog({
      userId: req.user?.id,
      action: 'CONTACT_DELETE',
      resource: 'Contact',
      resourceId: contactId,
    });

    res.status(200).json({ success: true, message: 'Contact deleted successfully' });
  }
}
