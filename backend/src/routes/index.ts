import { Router } from 'express';
import authRoutes from './auth.routes';
import contactRoutes from './contact.routes';
import conversationRoutes from './conversation.routes';
import webhookRoutes from './webhook.routes';
import dashboardRoutes from './dashboard.routes';
import userRoutes from './user.routes';
import salesforceRoutes from './salesforce.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/contacts', contactRoutes);
apiRouter.use('/conversations', conversationRoutes);
apiRouter.use('/webhooks', webhookRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/salesforce', salesforceRoutes);

export default apiRouter;
