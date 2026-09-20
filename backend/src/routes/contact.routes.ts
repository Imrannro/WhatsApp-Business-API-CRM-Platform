import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { contactCreateSchema, contactUpdateSchema } from '../../../lib/validation/schemas';

const router = Router();

router.use(requireAuth);

router.get('/', ContactController.list);
router.post('/', validateBody(contactCreateSchema), ContactController.create);
router.get('/:id', ContactController.getById);
router.patch('/:id', validateBody(contactUpdateSchema), ContactController.update);
router.delete('/:id', ContactController.delete);

export default router;
