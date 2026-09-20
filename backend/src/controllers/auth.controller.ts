import { Request, Response } from 'express';
import { dbStore } from '../../../lib/db/store';
import { generateToken, hashPassword, comparePassword } from '../../../lib/auth';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    const { email, password, name, role } = req.body;

    const existingUser = await dbStore.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ success: false, error: 'A user with this email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await dbStore.createUser({
      email,
      passwordHash,
      name,
      role: role || 'AGENT',
    });

    const token = generateToken(user);
    const { passwordHash: _p, ...safeUser } = user;

    await dbStore.createAuditLog({
      userId: user.id,
      action: 'USER_REGISTER',
      resource: 'User',
      resourceId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: { user: safeUser, token },
    });
  }

  public static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    const user = await dbStore.findUserByEmail(email);
    if (!user || user.status === 'INACTIVE') {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user);
    const { passwordHash: _p, ...safeUser } = user;

    await dbStore.createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'User',
      resourceId: user.id,
      details: { email: user.email, method: 'PASSWORD' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: { user: safeUser, token },
    });
  }

  public static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (req.user) {
      await dbStore.createAuditLog({
        userId: req.user.id,
        action: 'USER_LOGOUT',
        resource: 'User',
        resourceId: req.user.id,
      });
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  public static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  }
}
