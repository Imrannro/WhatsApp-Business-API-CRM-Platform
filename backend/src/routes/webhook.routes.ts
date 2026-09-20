import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

// Meta verification GET
router.get('/whatsapp', WebhookController.verify);

// Meta event processing POST
router.post('/whatsapp', WebhookController.handleEvent);

// Inspection & Simulator endpoints
router.get('/whatsapp/events', WebhookController.getEvents);
router.post('/whatsapp/simulate', WebhookController.simulate);

export default router;
