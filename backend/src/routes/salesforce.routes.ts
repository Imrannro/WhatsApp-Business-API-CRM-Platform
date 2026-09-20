import { Router } from 'express';
import { SalesforceController } from '../controllers/salesforce.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Public / OAuth handshake routes
router.get('/status', SalesforceController.getStatus);
router.get('/auth-url', SalesforceController.getAuthUrl);
router.post('/oauth/callback', SalesforceController.handleOAuthCallback);
router.post('/webhook', SalesforceController.handleWebhook);

// Protected routes (Agents + Admins)
router.use(requireAuth);

router.get('/logs', SalesforceController.getLogs);
router.get('/mappings', SalesforceController.getMappings);
router.get('/describe/:sobject', SalesforceController.describeSObject);

// Action endpoints for records
router.post('/contacts/:id/sync', SalesforceController.syncContact);
router.post('/messages/:id/sync', SalesforceController.syncMessage);
router.post('/conversations/:id/sync', SalesforceController.syncConversation);

// Admin-only management endpoints
router.post('/connect-direct', requireRole('ADMIN'), SalesforceController.connectDirect);
router.post('/disconnect', requireRole('ADMIN'), SalesforceController.disconnect);
router.patch('/settings', requireRole('ADMIN'), SalesforceController.updateSettings);
router.post('/sync', requireRole('ADMIN'), SalesforceController.triggerSync);
router.delete('/logs', requireRole('ADMIN'), SalesforceController.clearLogs);

// Field mapping management (Admin)
router.post('/mappings', requireRole('ADMIN'), SalesforceController.createMapping);
router.patch('/mappings/:id', requireRole('ADMIN'), SalesforceController.updateMapping);
router.delete('/mappings/:id', requireRole('ADMIN'), SalesforceController.deleteMapping);
router.post('/mappings/reset', requireRole('ADMIN'), SalesforceController.resetMappings);

export default router;

