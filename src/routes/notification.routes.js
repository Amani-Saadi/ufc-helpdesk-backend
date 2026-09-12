import { Router } from 'express';
import { consulterMesNotifications, marquerCommeLue } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, consulterMesNotifications);
router.patch('/:id/read', authenticate, marquerCommeLue);

export default router;
