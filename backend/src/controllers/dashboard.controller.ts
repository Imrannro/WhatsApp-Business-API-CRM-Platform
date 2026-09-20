import { Response } from 'express';
import { dbStore } from '../../../lib/db/store';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class DashboardController {
  public static async getStats(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const stats = await dbStore.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  }

  public static async getAuditLogs(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const logs = await dbStore.getAuditLogs(100);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  }
}
