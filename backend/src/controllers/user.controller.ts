import { Response } from 'express';
import { dbStore } from '../../../lib/db/store';
import { hashPassword } from '../../../lib/auth';
import { getWhatsAppProvider, setWhatsAppProviderOverride } from '../../../lib/whatsapp';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class UserController {
  public static async list(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const users = await dbStore.getAllUsers();
    res.status(200).json({ success: true, count: users.length, data: users });
  }

  public static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { email, password, name, role } = req.body;

    const existing = await dbStore.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ success: false, error: 'User with this email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await dbStore.createUser({
      email,
      passwordHash,
      name,
      role: role || 'AGENT',
    });

    const { passwordHash: _p, ...safeUser } = user;

    await dbStore.createAuditLog({
      userId: req.user?.id,
      action: 'USER_CREATE',
      resource: 'User',
      resourceId: user.id,
      details: { email: user.email, role: user.role, name: user.name },
    });

    res.status(201).json({ success: true, data: safeUser });
  }

  public static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, role, status, password } = req.body;
    const updates: Record<string, unknown> = {};

    if (name) updates.name = name;
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (password) updates.passwordHash = await hashPassword(password);

    const userId = String(req.params.id);
    const updated = await dbStore.updateUser(userId, updates);
    if (!updated) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const { passwordHash: _p, ...safeUser } = updated;

    await dbStore.createAuditLog({
      userId: req.user?.id,
      action: 'USER_UPDATE',
      resource: 'User',
      resourceId: updated.id,
      details: { role, status, name },
    });

    res.status(200).json({ success: true, data: safeUser });
  }

  public static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = String(req.params.id);
    if (userId === req.user?.id) {
      res.status(400).json({ success: false, error: 'Cannot delete your own account' });
      return;
    }

    const success = await dbStore.deleteUser(userId);
    if (!success) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    await dbStore.createAuditLog({
      userId: req.user?.id,
      action: 'USER_DELETE',
      resource: 'User',
      resourceId: userId,
    });

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  }

  public static async getSettings(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const provider = getWhatsAppProvider();
    res.status(200).json({
      success: true,
      whatsapp: provider.getStatus(),
    });
  }

  public static async toggleProvider(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { provider } = req.body;
    if (provider !== 'meta' && provider !== 'mock') {
      res.status(400).json({ success: false, error: 'Provider must be "meta" or "mock"' });
      return;
    }

    const active = setWhatsAppProviderOverride(provider);
    await dbStore.createAuditLog({
      userId: req.user?.id,
      action: 'SETTINGS_UPDATE',
      resource: 'WhatsAppProvider',
      details: { provider: active.name, isMock: active.isMock },
    });

    res.status(200).json({
      success: true,
      message: `WhatsApp provider set to ${active.name}`,
      status: active.getStatus(),
    });
  }
}
