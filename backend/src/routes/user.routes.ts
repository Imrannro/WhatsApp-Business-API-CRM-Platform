import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { userCreateSchema, userUpdateSchema } from '../../../lib/validation/schemas';

const router = Router();

router.use(requireAuth);

router.get('/', UserController.list);
router.post('/', requireRole('ADMIN'), validateBody(userCreateSchema), UserController.create);
router.patch('/:id', requireRole('ADMIN'), validateBody(userUpdateSchema), UserController.update);
router.delete('/:id', requireRole('ADMIN'), UserController.delete);

// Settings
router.get('/settings/whatsapp', UserController.getSettings);
router.post('/settings/whatsapp-provider', requireRole('ADMIN'), UserController.toggleProvider);

export default router;
