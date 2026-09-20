import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  conversationCreateSchema,
  conversationUpdateSchema,
  conversationAssignSchema,
  sendMessageSchema,
  internalNoteSchema,
} from '../../../lib/validation/schemas';

const router = Router();

router.use(requireAuth);

router.get('/', ConversationController.list);
router.post('/', validateBody(conversationCreateSchema), ConversationController.create);
router.get('/:id', ConversationController.getById);
router.patch('/:id', validateBody(conversationUpdateSchema), ConversationController.update);
router.post(
  '/:id/assign',
  requireRole('ADMIN'),
  validateBody(conversationAssignSchema),
  ConversationController.assign
);
router.get('/:id/messages', ConversationController.getMessages);
router.post('/:id/messages', validateBody(sendMessageSchema), ConversationController.sendMessage);
router.post('/:id/notes', validateBody(internalNoteSchema), ConversationController.addNote);

export default router;
