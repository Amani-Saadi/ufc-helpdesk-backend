import { Router } from 'express';
import { 
  consulterMesNotifications, 
  marquerCommeLue, 
  marquerToutesCommeLues 
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, consulterMesNotifications);
router.patch('/read-all', authenticate, marquerToutesCommeLues);
router.patch('/:id/read', authenticate, marquerCommeLue);

export default router;