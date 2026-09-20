import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/stats', DashboardController.getStats);
router.get('/audit-logs', DashboardController.getAuditLogs);

export default router;
